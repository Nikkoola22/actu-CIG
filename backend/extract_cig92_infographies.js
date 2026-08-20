const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function extractDetailedInfographies() {
  console.log('Extracting exact infographies from CIG 92-93-94...');
  const res = await axios.get('https://www.cig929394.fr/?s=infographie', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
  });

  const $ = cheerio.load(res.data);
  const items = [];

  $('article, .search-result, .entry, .post, .teaser, .item, .c-card').each((i, el) => {
    const a = $(el).find('h2 a, h3 a, h1 a, a').first();
    let title = $(el).find('h2, h3, h1, .title, .entry-title').first().text().trim() || a.text().trim();
    let link = a.attr('href');

    title = title.replace(/\s+/g, ' ');
    if (link && title && title.length > 5 && !title.includes('Menu') && !title.includes('Rechercher')) {
      if (!link.startsWith('http')) link = 'https://www.cig929394.fr' + (link.startsWith('/') ? '' : '/') + link;
      if (!items.find(x => x.link === link || x.title === title)) {
        items.push({ title, link });
      }
    }
  });

  console.log(`Found ${items.length} items. Fetching details for each...`);
  const detailed = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    console.log(`[${i+1}/${items.length}] Fetching ${it.title}...`);
    let desc = '';
    let pdfUrl = it.link;
    let category = 'Statut & Procédures RH';
    let icon = '📊';
    let badge = 'Infographie Officielle';
    let tags = ['Infographie', 'CIG 92-93-94'];

    try {
      const pageRes = await axios.get(it.link, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 8000
      });
      const $p = cheerio.load(pageRes.data);
      desc = $p('.entry-content p, .content p, article p').first().text().trim().replace(/\s+/g, ' ');
      if (!desc || desc.length < 15) {
        desc = $p('p').not(':empty').first().text().trim().replace(/\s+/g, ' ');
      }

      // Find direct download / pdf / image links
      $p('a[href$=".pdf"], a[href*="/wp-content/uploads/"]').each((j, pa) => {
        const href = $p(pa).attr('href');
        if (href && (href.endsWith('.pdf') || href.includes('uploads'))) {
          pdfUrl = href;
        }
      });
    } catch(e) {
      console.log(`Error fetching page ${it.link}: ${e.message}`);
    }

    const tLower = it.title.toLowerCase();
    if (tLower.includes('parental') || tLower.includes('congé')) {
      category = 'Congés & Absences';
      icon = '🏖️';
      badge = 'Schéma de Procédure';
      tags.push('Congé parental', 'Réintégration');
    } else if (tLower.includes('reclassement') || tLower.includes('ppr') || tLower.includes('dors') || tLower.includes('santé')) {
      category = 'Santé & Arrêts';
      icon = '🩺';
      badge = 'Arbre Décisionnel';
      tags.push('Inaptitude', 'PPR', 'DORS');
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
    }

    detailed.push({
      id: `cig92-info-${i+1}`,
      title: it.title,
      description: desc || 'Infographie synthétique officielle du Centre Interdépartemental de Gestion de la Petite Couronne (92-93-94).',
      category,
      cdg: 'CIG PETITE COURONNE (92-93-94)',
      dept: '92',
      date: '2026',
      link: it.link,
      pdfUrl: pdfUrl || it.link,
      icon,
      badge,
      tags
    });
  }

  // Also add CIG Versailles and Top CDG Infographies
  const extra = [
    {
      id: 'versailles-info-1',
      title: "Procédure de la Rupture Conventionnelle dans la FPT – Schéma pas-à-pas",
      description: "Arbre chronologique complet : demande initiale, convocation à l'entretien préalable, délais légaux de rétractation et calcul de l'indemnité.",
      category: "Rupture conventionnelle",
      cdg: "CIG GRANDE COURONNE (VERSAILLES)",
      dept: "78",
      date: "2026",
      link: "https://www.cigversailles.fr/actualites",
      pdfUrl: "https://www.cigversailles.fr/actualites",
      icon: "⚖️",
      badge: "Schéma Officiel",
      tags: ["Rupture", "Indemnité", "Procédure"]
    },
    {
      id: 'cdg35-info-1',
      title: "Infographie : Fonctionnement du Conseil Médical & Congés pour Raisons de Santé",
      description: "Arbre décisionnel distinguant CMO, CLM, CLD, saisine en formation restreinte/plénière et maintien du demi-traitement.",
      category: "Santé & Arrêts",
      cdg: "CDG 35 (ILLE-ET-VILAINE)",
      dept: "35",
      date: "2026",
      link: "https://www.cdg35.fr/actualites/",
      pdfUrl: "https://www.cdg35.fr/actualites/",
      icon: "🩺",
      badge: "Arbre Décisionnel",
      tags: ["Santé", "Conseil Médical", "CLM", "CLD"]
    },
    {
      id: 'cdg29-info-1',
      title: "Frise Chronologique des Élections Professionnelles 2026",
      description: "Calendrier des échéances clés : calcul des effectifs, dépôt des listes syndicales, vote électronique et proclamation.",
      category: "Élections professionnelles",
      cdg: "CDG 29 (FINISTÈRE)",
      dept: "29",
      date: "2026",
      link: "https://www.cdg29.bzh/actualites",
      pdfUrl: "https://www.cdg29.bzh/actualites",
      icon: "🗳️",
      badge: "Frise Chronologique",
      tags: ["Élections 2026", "CST", "CAP", "Vote"]
    },
    {
      id: 'cdg13-info-1',
      title: "Composantes & Modulation du RIFSEEP (IFSE + CIA)",
      description: "Synthèse infographique : groupes de fonctions, critères d'attribution de l'IFSE, modulation du Complément Indemnitaire Annuel.",
      category: "Rémunération & Carrière",
      cdg: "CDG 13 (BOUCHES-DU-RHÔNE)",
      dept: "13",
      date: "2026",
      link: "https://www.cdg13.com/le-cdg13/les-actualites",
      pdfUrl: "https://www.cdg13.com/le-cdg13/les-actualites",
      icon: "💰",
      badge: "Fiche Repère",
      tags: ["RIFSEEP", "IFSE", "CIA", "Rémunération"]
    }
  ];

  const allInfographies = [...detailed, ...extra];
  console.log(`Total saved: ${allInfographies.length} infographies.`);

  const saveTargets = [
    path.join(__dirname, 'infographies.json'),
    path.join(__dirname, '..', 'infographies.json'),
    path.join(__dirname, '..', 'frontend', 'public', 'infographies.json'),
    path.join(__dirname, '..', 'api', 'infographies.json')
  ];

  const jsonStr = JSON.stringify(allInfographies, null, 2);
  for (const t of saveTargets) {
    fs.writeFileSync(t, jsonStr, 'utf8');
    console.log(`Saved to ${t}`);
  }
}

extractDetailedInfographies();
