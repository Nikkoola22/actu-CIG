const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
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

async function scrapeAllVersaillesInfographics() {
  console.log('=== Crawling All Pages of CIG Versailles Infographics ===');
  const allVersaillesItems = [];

  // Crawl pages 0, 1, 2, 3
  for (let p = 0; p <= 4; p++) {
    const url = `https://www.cigversailles.fr/recherche?input-search-form=infographie&search_terms=&sort_bef_combine=relevance_DESC&page=${p}`;
    console.log(`\nFetching Page ${p}: ${url}...`);
    try {
      const html = await getRawHttps(url);
      const $ = cheerio.load(html);
      
      const pageItems = [];
      $('.views-row, article, .search-result, .node, .teaser, .item, .field-content').each((i, el) => {
        const a = $(el).is('a') ? $(el) : $(el).find('a').first();
        let title = $(el).find('h2, h3, h4, .title').first().text().trim() || a.text().trim();
        let link = a.attr('href');
        let desc = $(el).find('p, .search-snippet').first().text().trim().replace(/\s+/g, ' ');

        title = title.replace(/\s+/g, ' ');
        if (link && title && title.length > 8 && !title.includes('Menu') && !title.includes('Accessibilité') && !title.includes('Accueil')) {
          if (!link.startsWith('http')) link = 'https://www.cigversailles.fr' + (link.startsWith('/') ? '' : '/') + link;
          
          if (!allVersaillesItems.find(r => r.link === link || r.title === title)) {
            allVersaillesItems.push({ title, link, desc, page: p });
            pageItems.push({ title, link });
          }
        }
      });
      console.log(`Page ${p} returned ${pageItems.length} items.`);
      if (pageItems.length === 0) break;
    } catch(e) {
      console.error(`Error on page ${p}:`, e.message);
    }
  }

  console.log(`\nTotal Versailles items discovered: ${allVersaillesItems.length}`);
  console.log(JSON.stringify(allVersaillesItems, null, 2));

  // Build infographic objects with categories, icons, and direct PDF downloads
  const formattedVersailles = allVersaillesItems.map((item, idx) => {
    const tLower = item.title.toLowerCase();
    let category = 'Statut & Procédures RH';
    let icon = '📊';
    let badge = 'Schéma Officiel CIG';
    let tags = ['Infographie', 'CIG Versailles'];

    if (tLower.includes('rgpd') || tLower.includes('données') || tLower.includes('informatique')) {
      category = 'Numérique & RGPD';
      icon = '🔒';
      badge = 'Guide RGPD';
      tags.push('RGPD', 'Données', 'Cybersécurité');
    } else if (tLower.includes('médical') || tLower.includes('maladie') || tLower.includes('santé') || tLower.includes('cmo') || tLower.includes('cmu')) {
      category = 'Santé & Arrêts';
      icon = '🩺';
      badge = 'Conseil Médical / CMO';
      tags.push('Santé', 'CMO', 'Conseil Médical');
    } else if (tLower.includes('accident') || tLower.includes('trajet') || tLower.includes('citis')) {
      category = 'Santé & Arrêts';
      icon = '🚑';
      badge = 'Procédure CITIS';
      tags.push('Accident de service', 'Trajet', 'CITIS');
    } else if (tLower.includes('médiation') || tLower.includes('mpo')) {
      category = 'Instances & Déontologie';
      icon = '⚖️';
      badge = 'Médiation MPO';
      tags.push('Médiation', 'MPO', 'Dialogue');
    } else if (tLower.includes('stage') || tLower.includes('stagiaire') || tLower.includes('recrutement')) {
      category = 'Recrutement & Concours';
      icon = '💼';
      badge = 'Fiche RH';
      tags.push('Recrutement', 'Stagiaire');
    } else if (tLower.includes('retraite') || tLower.includes('pension')) {
      category = 'Retraite & CNRACL';
      icon = '⏳';
      badge = 'Barème Retraite';
      tags.push('Retraite', 'CNRACL');
    }

    return {
      id: `versailles-all-${idx+1}`,
      title: item.title,
      description: item.desc || `Infographie et guide synthétique officiel publié par le CIG Grande Couronne (Versailles - 78, 91, 95).`,
      category,
      cdg: 'CIG GRANDE COURONNE (VERSAILLES)',
      dept: '78',
      date: '2026',
      link: item.link,
      pdfUrl: item.link, // /ged/ links on cigversailles.fr serve the PDF directly!
      imageUrl: 'https://www.cig929394.fr/wp-content/uploads/2025/09/info_ppr_2024_06_vf-179x252.jpg',
      icon,
      badge,
      tags
    };
  });

  // Load existing infographies.json and merge
  const existingPath = path.join(__dirname, 'infographies.json');
  const existingList = JSON.parse(fs.readFileSync(existingPath, 'utf8'));

  // Merge uniquely
  const merged = [...formattedVersailles];
  for (const it of existingList) {
    if (!merged.find(m => m.title === it.title || m.pdfUrl === it.pdfUrl)) {
      merged.push(it);
    }
  }

  console.log(`\nFinal Merged Infographics Count: ${merged.length}`);

  const saveTargets = [
    path.join(__dirname, 'infographies.json'),
    path.join(__dirname, '..', 'infographies.json'),
    path.join(__dirname, '..', 'frontend', 'public', 'infographies.json'),
    path.join(__dirname, '..', 'api', 'infographies.json')
  ];

  const jsonStr = JSON.stringify(merged, null, 2);
  for (const t of saveTargets) {
    fs.writeFileSync(t, jsonStr, 'utf8');
    console.log(`Saved to ${t}`);
  }
}

scrapeAllVersaillesInfographics();
