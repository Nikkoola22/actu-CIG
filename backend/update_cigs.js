const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
const cheerio = require('cheerio');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function getRawHttps(urlStr) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const req = https.request({
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Host': parsed.hostname
      },
      insecureHTTPParser: true,
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', err => reject(err));
    req.end();
  });
}

async function scrapeCigs() {
  console.log('--- Scraping CIG Versailles ---');
  let newsVersailles = [];
  try {
    const html1 = await getRawHttps('https://www.cigversailles.fr/actualites');
    const $1 = cheerio.load(html1);
    $1('.views-row, article.node--type-actualite, .node--type-actualite, .field--name-node-title').each((i, el) => {
      const a = $1(el).is('a') ? $1(el) : $1(el).find('a').first();
      const title = $1(el).find('h2, h3, .field--name-node-title, a').first().text().trim().replace(/\s+/g, ' ');
      let href = a.attr('href');
      if (href && title && title.length > 8 && !title.includes('Menu') && !title.includes('Accessibilité')) {
        if (!href.startsWith('http')) href = 'https://www.cigversailles.fr' + (href.startsWith('/') ? '' : '/') + href;
        if (!newsVersailles.find(r => r.link === href)) {
          newsVersailles.push({ title, link: href, source: 'HTML (CIG Versailles)' });
        }
      }
    });
  } catch(e) {
    console.error('Error scraping Versailles:', e.message);
  }
  console.log(`Versailles extracted ${newsVersailles.length} items`);

  console.log('\n--- Scraping CIG Petite Couronne (92-93-94) ---');
  let news92 = [];
  try {
    const { data: html2 } = await axios.get('https://www.cig929394.fr/actualites', {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $2 = cheerio.load(html2);
    $2('article, .views-row, .card, h2 a, h3 a, .field-content a').each((i, el) => {
      const a = $2(el).is('a') ? $2(el) : $2(el).find('a').first();
      const title = $2(el).find('h2, h3, .field-content').first().text().trim().replace(/\s+/g, ' ') || a.text().trim().replace(/\s+/g, ' ');
      let href = a.attr('href');
      if (href && title && title.length > 10 && !title.includes('Menu') && !title.includes('Accueil') && !title.includes('Accessibilité')) {
        if (!href.startsWith('http')) href = 'https://www.cig929394.fr' + (href.startsWith('/') ? '' : '/') + href;
        if (!news92.find(r => r.link === href)) {
          news92.push({ title, link: href, source: 'HTML (CIG Petite Couronne)' });
        }
      }
    });
  } catch(e) {
    console.error('Error scraping CIG 92-93-94:', e.message);
  }
  console.log(`CIG 92-93-94 extracted ${news92.length} items`);

  // Load existing data.json
  const dataPath = path.join(__dirname, 'data.json');
  let allData = [];
  if (fs.existsSync(dataPath)) {
    allData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  // Update or insert CIG Versailles
  const idxVersailles = allData.findIndex(d => d.cdg.includes('VERSAILLES') || d.cdg.includes('78') || d.cdg.includes('GRANDE COURONNE'));
  const entryVersailles = {
    cdg: '(78) CIG GRANDE COURONNE (VERSAILLES - 78, 91, 95)',
    officialUrl: 'https://www.cigversailles.fr/actualites',
    news: newsVersailles.slice(0, 5)
  };
  if (idxVersailles >= 0) {
    allData[idxVersailles] = entryVersailles;
  } else {
    allData.push(entryVersailles);
  }

  // Update or insert CIG Petite Couronne
  const idx92 = allData.findIndex(d => d.cdg.includes('PETITE COURONNE') || d.cdg.includes('92-93-94') || d.cdg.includes('92'));
  const entry92 = {
    cdg: '(92) CIG PETITE COURONNE (92, 93, 94)',
    officialUrl: 'https://www.cig929394.fr/actualites',
    news: news92.slice(0, 5)
  };
  if (idx92 >= 0) {
    allData[idx92] = entry92;
  } else {
    allData.push(entry92);
  }

  // Save to all target locations
  const saveTargets = [
    path.join(__dirname, 'data.json'),
    path.join(__dirname, '..', 'data.json'),
    path.join(__dirname, '..', 'frontend', 'public', 'data.json'),
    path.join(__dirname, '..', 'api', 'data.json')
  ];

  const jsonStr = JSON.stringify(allData, null, 2);
  for (const t of saveTargets) {
    fs.writeFileSync(t, jsonStr, 'utf8');
    console.log(`Saved ${allData.length} CDGs/CIGs to ${t}`);
  }
}

scrapeCigs().then(() => console.log('Done!'));
