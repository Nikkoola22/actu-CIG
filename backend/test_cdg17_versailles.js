const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const { URL } = require('url');

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

async function testSources() {
  console.log('--- 1. Testing CIG Versailles Search ---');
  try {
    const vUrl = 'https://www.cigversailles.fr/recherche?input-search-form=infographie&search_terms=&sort_bef_combine=relevance_DESC';
    const vHtml = await getRawHttps(vUrl);
    const $v = cheerio.load(vHtml);
    console.log('Versailles HTML length:', vHtml.length);
    
    const vResults = [];
    $v('.views-row, article, .search-result, .node, .teaser, .item, .field-content').each((i, el) => {
      const a = $v(el).is('a') ? $v(el) : $v(el).find('a').first();
      let title = $v(el).find('h2, h3, h4, .title').first().text().trim() || a.text().trim();
      let link = a.attr('href');
      let img = $v(el).find('img').first().attr('src');
      let desc = $v(el).find('p, .search-snippet').first().text().trim().replace(/\s+/g, ' ');

      title = title.replace(/\s+/g, ' ');
      if (link && title && title.length > 8 && !title.includes('Menu') && !title.includes('Accessibilité')) {
        if (!link.startsWith('http')) link = 'https://www.cigversailles.fr' + (link.startsWith('/') ? '' : '/') + link;
        if (img && !img.startsWith('http')) img = 'https://www.cigversailles.fr' + (img.startsWith('/') ? '' : '/') + img;
        if (!vResults.find(r => r.link === link || r.title === title)) {
          vResults.push({ title, link, desc, img });
        }
      }
    });
    console.log(`Versailles items found (${vResults.length}):`);
    console.log(JSON.stringify(vResults.slice(0, 10), null, 2));
  } catch(e) {
    console.error('Versailles error:', e.message);
  }

  console.log('\n--- 2. Testing CDG 17 (Charente-Maritime) ---');
  try {
    const res17 = await axios.get('https://www.cdg17.fr/?s=infographie', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });
    const $17 = cheerio.load(res17.data);
    const results17 = [];
    $17('article, .entry, .post, .item, .c-card, a[href*="infographie"]').each((i, el) => {
      const a = $17(el).is('a') ? $17(el) : $17(el).find('a').first();
      let title = $17(el).find('h2, h3, h1, .entry-title').first().text().trim() || a.text().trim();
      let link = a.attr('href');
      let img = $17(el).find('img').first().attr('src');
      let desc = $17(el).find('p').first().text().trim().replace(/\s+/g, ' ');

      title = title.replace(/\s+/g, ' ');
      if (link && title && title.length > 5 && !title.includes('Menu')) {
        if (!results17.find(r => r.link === link || r.title === title)) {
          results17.push({ title, link, desc, img });
        }
      }
    });
    console.log(`CDG 17 items found (${results17.length}):`);
    console.log(JSON.stringify(results17.slice(0, 10), null, 2));
  } catch(e) {
    console.error('CDG 17 error:', e.message);
  }
}

testSources();
