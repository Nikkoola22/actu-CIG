const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function crawlInfographicsFull() {
  console.log('=== Crawling Full Infographics with Visuals & Direct PDFs ===');
  
  const searchUrl = 'https://www.cig929394.fr/?s=infographie';
  const { data: searchHtml } = await axios.get(searchUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });

  const $ = cheerio.load(searchHtml);
  const rawList = [];

  $('article, .search-result, .entry, .post, .teaser, .item, .c-card').each((i, el) => {
    const a = $(el).find('h2 a, h3 a, h1 a, a').first();
    let title = $(el).find('h2, h3, h1, .title, .entry-title').first().text().trim() || a.text().trim();
    let link = a.attr('href');

    title = title.replace(/\s+/g, ' ');
    if (link && title && title.length > 5 && !title.includes('Menu') && !title.includes('Rechercher')) {
      if (!link.startsWith('http')) link = 'https://www.cig929394.fr' + (link.startsWith('/') ? '' : '/') + link;
      if (!rawList.find(x => x.link === link || x.title === title)) {
        rawList.push({ title, link });
      }
    }
  });

  console.log(`Found ${rawList.length} infographic pages to scrape.`);
  const infographies = [];

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    console.log(`[${i+1}/${rawList.length}] Scraping: ${item.title}...`);
    
    let description = '';
    let imageUrl = null;
    let pdfUrl = null;

    try {
      const pageRes = await axios.get(item.link, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 10000
      });
      const $p = cheerio.load(pageRes.data);

      // Extract Description
      description = $p('.entry-content p, .content p, article p').first().text().trim().replace(/\s+/g, ' ');
      if (!description || description.length < 20) {
        description = $p('p').not(':empty').first().text().trim().replace(/\s+/g, ' ');
      }

      // Extract Images
      const foundImages = [];
      $p('article img, .entry-content img, .content img, main img, figure img').each((j, el) => {
        let src = $p(el).attr('src') || $p(el).attr('data-src') || $p(el).attr('data-lazy-src');
        if (src && !src.includes('logo') && !src.includes('avatar') && !src.includes('icon') && !src.includes('header')) {
          if (!src.startsWith('http')) src = 'https://www.cig929394.fr' + src;
          // Prefer full resolution by removing -178x252 / -300x200 thumb suffix if possible
          const fullRes = src.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1');
          foundImages.push(fullRes);
          foundImages.push(src);
        }
      });
      if (foundImages.length > 0) {
        imageUrl = foundImages[0];
      }

      // Extract PDF Download Links
      $p('a[href$=".pdf"], a[href*="/wp-content/uploads/"]').each((j, el) => {
        let href = $p(el).attr('href');
        if (href && (href.endsWith('.pdf') || href.includes('uploads'))) {
          if (!href.startsWith('http')) href = 'https://www.cig929394.fr' + href;
          if (!pdfUrl && href.endsWith('.pdf')) {
            pdfUrl = href;
          }
        }
      });
    } catch(e) {
      console.log(`Failed fetching ${item.link}: ${e.message}`);
    }

    // Categorization
    const tLower = item.title.toLowerCase();
    let category = 'Statut & Procédures RH';
    let icon = '📊';
    let badge = 'Infographie Officielle';
    let tags = ['Infographie', 'CIG 92-93-94'];

    if (tLower.includes('parental') || tLower.includes('congé')) {
      category = 'Congés & Absences';
      icon = '🏖️';
      badge = 'Schéma de Procédure';
      tags.push('Congé parental', 'Réintégration');
    } else if (tLower.includes('reclassement') || tLower.includes('ppr') || tLower.includes('dors') || tLower.includes('santé') || tLower.includes('maladie')) {
      category = 'Santé & Arrêts';
      icon = '🩺';
      badge = 'Arbre Décisionnel';
      tags.push('Inaptitude', 'PPR', 'CMO');
    } else if (tLower.includes('classement') || tLower.includes('stagiaire') || tLower.includes('catégorie')) {
      category = 'Rémunération & Carrière';
      icon = '📋';
      badge = 'Guide de Classement';
      tags.push('Carrière', 'Nomination', 'Stagiaire');
    } else if (tLower.includes('direction') || tLower.includes('détachement') || tLower.includes('recrutement')) {
      category = 'Recrutement & Direction';
      icon = '💼';
      badge = 'Fiche RH Direction';
      tags.push('Emplois fonctionnels', 'Direction');
    } else if (tLower.includes('cumul')) {
      category = 'Instances & Déontologie';
      icon = '⚖️';
      badge = 'Guide Déontologie';
      tags.push('Cumul d\'activités', 'Déontologie');
    }

    infographies.push({
      id: `cig92-info-${i+1}`,
      title: item.title,
      description: description || 'Infographie synthétique officielle du Centre Interdépartemental de Gestion de la Petite Couronne (92-93-94).',
      category,
      cdg: 'CIG PETITE COURONNE (92-93-94)',
      dept: '92',
      date: '2026',
      link: item.link, // Direct article publication URL!
      pdfUrl: pdfUrl || item.link,
      imageUrl: imageUrl || null,
      icon,
      badge,
      tags
    });
  }

  console.log(`\nExtracted ${infographies.length} complete infographics.`);

  const saveTargets = [
    path.join(__dirname, 'infographies.json'),
    path.join(__dirname, '..', 'infographies.json'),
    path.join(__dirname, '..', 'frontend', 'public', 'infographies.json'),
    path.join(__dirname, '..', 'api', 'infographies.json')
  ];

  const jsonStr = JSON.stringify(infographies, null, 2);
  for (const t of saveTargets) {
    fs.writeFileSync(t, jsonStr, 'utf8');
    console.log(`Saved to ${t}`);
  }
}

crawlInfographicsFull();
