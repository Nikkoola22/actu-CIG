const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Known CDG/CIG infographies sections and search targets
const TARGET_CDG_INFOGRAPHIES = [
  { cdg: 'CIG Grande Couronne (Versailles)', dept: '78', url: 'https://www.cigversailles.fr/recherche?search_api_fulltext=infographie' },
  { cdg: 'CIG Petite Couronne (92-93-94)', dept: '92', url: 'https://www.cig929394.fr/recherche?search_api_fulltext=infographie' },
  { cdg: 'CDG 35 (Ille-et-Vilaine)', dept: '35', url: 'https://www.cdg35.fr/?s=infographie' },
  { cdg: 'CDG 29 (Finistère)', dept: '29', url: 'https://www.cdg29.bzh/?s=infographie' },
  { cdg: 'CDG 13 (Bouches-du-Rhône)', dept: '13', url: 'https://www.cdg13.com/?s=infographie' },
  { cdg: 'CDG 33 (Gironde)', dept: '33', url: 'https://www.cdg33.fr/?s=infographie' },
  { cdg: 'CDG 69 (Rhône)', dept: '69', url: 'https://www.cdg69.fr/recherche.phtml?mots=infographie' },
  { cdg: 'CDG 59 (Nord)', dept: '59', url: 'https://www.cdg59.fr/?s=infographie' },
  { cdg: 'CDG 44 (Loire-Atlantique)', dept: '44', url: 'https://www.cdg44.fr/?s=infographie' },
  { cdg: 'CDG 31 (Haute-Garonne)', dept: '31', url: 'https://www.cdg31.fr/recherche?search_api_fulltext=infographie' },
  { cdg: 'CDG 67 (Bas-Rhin)', dept: '67', url: 'https://www.cdg67.fr/?s=infographie' },
  { cdg: 'CDG 74 (Haute-Savoie)', dept: '74', url: 'https://www.cdg74.fr/?s=infographie' },
  { cdg: 'CDG 76 (Seine-Maritime)', dept: '76', url: 'https://www.cdg76.fr/?s=infographie' },
  { cdg: 'CDG 27 (Eure)', dept: '27', url: 'https://www.cdg27.fr/?s=infographie' },
  { cdg: 'CDG 37 (Indre-et-Loire)', dept: '37', url: 'https://www.cdg37.fr/?s=infographie' },
  { cdg: 'FNCDG', dept: 'FNCDG', url: 'https://fncdg.com/?s=infographie' }
];

async function scanInfographies() {
  console.log('--- Scanning CDGs & CIGs for Infographies ---');
  const infographies = [];

  for (const target of TARGET_CDG_INFOGRAPHIES) {
    console.log(`Scanning ${target.cdg}...`);
    try {
      const res = await axios.get(target.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 9000,
        validateStatus: () => true
      });

      if (res.status === 200 && typeof res.data === 'string') {
        const $ = cheerio.load(res.data);
        $('article, .views-row, .entry, .post, .item, .search-result, .card, a[href*="infographie"], a[href*="schema"]').each((i, el) => {
          const a = $(el).is('a') ? $(el) : $(el).find('a').first();
          let title = $(el).find('h2, h3, h4, .title, .entry-title').first().text().trim() || a.text().trim();
          let link = a.attr('href');
          
          // Image / thumbnail
          let img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

          title = title.replace(/\s+/g, ' ').replace(/^infographie\s*:?\s*/i, '');
          if (link && title && title.length > 8 && !title.toLowerCase().includes('résultat') && !title.toLowerCase().includes('recherche')) {
            if (!link.startsWith('http')) {
              try {
                const u = new URL(target.url);
                link = u.origin + (link.startsWith('/') ? '' : '/') + link;
              } catch(e) {}
            }
            if (img && !img.startsWith('http')) {
              try {
                const u = new URL(target.url);
                img = u.origin + (img.startsWith('/') ? '' : '/') + img;
              } catch(e) {}
            }

            if (!infographies.find(item => item.link === link || item.title === title)) {
              infographies.push({
                title,
                link,
                image: img || null,
                cdg: target.cdg,
                dept: target.dept,
                category: categorize(title)
              });
            }
          }
        });
      }
    } catch(err) {
      console.log(`Failed for ${target.cdg}: ${err.message}`);
    }
  }

  // Also extract from current articles in data.json that have keywords like schéma, infographie, guide, procédure
  try {
    const dataJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
    for (const cdg of dataJson) {
      const news = cdg.news || [];
      for (const item of news) {
        const titleLower = (item.title || '').toLowerCase();
        if (titleLower.includes('infographie') || titleLower.includes('schéma') || titleLower.includes('schema') || titleLower.includes('procédure') || titleLower.includes('guide') || titleLower.includes('barème') || titleLower.includes('tableau') || titleLower.includes('arbre') || titleLower.includes('fiches repères') || titleLower.includes('fiches-repères')) {
          if (!infographies.find(x => x.link === item.link)) {
            infographies.push({
              title: item.title,
              link: item.link,
              image: null,
              cdg: cdg.cdg.replace(/^\s*\(\s*\d+[A-B]?\s*\)\s*-?\s*/i, '').trim(),
              dept: (cdg.cdg.match(/\d+[A-B]?/) || ['CDG'])[0],
              category: categorize(item.title)
            });
          }
        }
      }
    }
  } catch(e) {}

  console.log(`\nFound total ${infographies.length} Infographies!`);
  console.log('Sample infographies:', JSON.stringify(infographies.slice(0, 8), null, 2));

  // Save infographies.json
  const saveTargets = [
    path.join(__dirname, 'infographies.json'),
    path.join(__dirname, '..', 'infographies.json'),
    path.join(__dirname, '..', 'frontend', 'public', 'infographies.json'),
    path.join(__dirname, '..', 'api', 'infographies.json')
  ];

  const jsonStr = JSON.stringify(infographies, null, 2);
  for (const t of saveTargets) {
    try {
      fs.writeFileSync(t, jsonStr, 'utf8');
      console.log(`Saved to: ${t}`);
    } catch(e) {}
  }
}

function categorize(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('rupture') || t.includes('convention')) return 'Rupture conventionnelle';
  if (t.includes('retraite') || t.includes('pension') || t.includes('cnracl')) return 'Retraite & CNRACL';
  if (t.includes('santé') || t.includes('sante') || t.includes('maladie') || t.includes('inaptitude') || t.includes('temps partiel')) return 'Santé & Arrêts';
  if (t.includes('congé') || t.includes('conge') || t.includes('absence') || t.includes('rsu')) return 'Congés & Absences';
  if (t.includes('rémunération') || t.includes('remuneration') || t.includes('prime') || t.includes('salaire') || t.includes('smic') || t.includes('rifseep')) return 'Rémunération & Primes';
  if (t.includes('élection') || t.includes('election') || t.includes('vote') || t.includes('scrutin')) return 'Élections professionnelles';
  if (t.includes('recrutement') || t.includes('concours') || t.includes('emploi') || t.includes('stage')) return 'Recrutement & Concours';
  if (t.includes('canicule') || t.includes('chaleur') || t.includes('sécurité') || t.includes('prévention')) return 'Prévention & Sécurité';
  return 'Statut & Procédures RH';
}

scanInfographies();
