const fs = require('fs');
const path = require('path');

const existingPath = path.join(__dirname, 'infographies.json');
const currentList = JSON.parse(fs.readFileSync(existingPath, 'utf8'));

// New CIG Versailles & CDG 17 Infographics
const newInfographies = [
  {
    id: "cdg17-info-1",
    title: "Les infographies du CDG17 – Fin de détachement sur emploi fonctionnel",
    description: "Procédure et calendrier de fin de détachement sur emploi fonctionnel de direction à l’initiative de l’autorité territoriale : entretien préalable, préavis, indemnités et accompagnement CDG17.",
    category: "Recrutement & Direction",
    cdg: "CDG 17 (CHARENTE-MARITIME)",
    dept: "17",
    date: "2026",
    link: "https://www.cdg17.fr/",
    pdfUrl: "https://www.cdg17.fr/wp-content/uploads/2026/06/Les-infographies-du-CDG17-2026-Fin-de-detachement-sur-emploi-fonctionnel-VF.pdf",
    imageUrl: "https://www.cig929394.fr/wp-content/uploads/2026/03/Infographie_CIG-PC_Fin-Detachement-Emplois-fonctionnels_2026_03-1-pdf.jpg",
    icon: "💼",
    badge: "Guide Procédure CDG17",
    tags: ["Infographie", "CDG 17", "Emplois fonctionnels", "Détachement"]
  },
  {
    id: "cdg17-info-2",
    title: "Les infographies du CDG17 – Règles de classement à la nomination stagiaire",
    description: "Synthèse infographique des règles de reprise des services antérieurs (secteur public, secteur privé, contractuel) pour le classement à la nomination stagiaire.",
    category: "Rémunération & Carrière",
    cdg: "CDG 17 (CHARENTE-MARITIME)",
    dept: "17",
    date: "2026",
    link: "https://www.cdg17.fr/",
    pdfUrl: "https://www.cdg17.fr/wp-content/uploads/2025/12/Les-infographies-du-CDG17-Regles-de-classement.pdf",
    imageUrl: "https://www.cig929394.fr/wp-content/uploads/2025/07/Infographie-CIGPC_Regles_generales_classement_nomination_stagiaire_Categorie_C_page_1-pdf.jpg",
    icon: "📋",
    badge: "Guide de Classement",
    tags: ["Infographie", "CDG 17", "Classement", "Stagiaire"]
  },
  {
    id: "versailles-info-1",
    title: "Infographie – Le Conseil Médical Unique (CMU)",
    description: "Schéma de saisine en formation restreinte ou plénière, rôle des médecins agréés, délais et arbre des avis pour les congés pour raison de santé.",
    category: "Santé & Arrêts",
    cdg: "CIG GRANDE COURONNE (VERSAILLES)",
    dept: "78",
    date: "2026",
    link: "https://www.cigversailles.fr/recherche?input-search-form=infographie&search_terms=&sort_bef_combine=relevance_DESC",
    pdfUrl: "https://www.cigversailles.fr/ged/espace-documentaire-cig/expertise-statutaire/conseil-medical-unique-cmu/infographie-le-conseil-medical",
    imageUrl: "https://www.cig929394.fr/wp-content/uploads/2025/09/info_ppr_2024_06_vf-179x252.jpg",
    icon: "🩺",
    badge: "Schéma Officiel CIG",
    tags: ["Infographie", "CIG Versailles", "Conseil Médical", "Santé"]
  },
  {
    id: "versailles-info-2",
    title: "Infographie – Les étapes de la Médiation Préalable Obligatoire (MPO)",
    description: "Arbre chronologique des étapes de la médiation territoriale : saisine, accord des parties, entretiens confidentiels et protocole d'accord.",
    category: "Instances & Déontologie",
    cdg: "CIG GRANDE COURONNE (VERSAILLES)",
    dept: "78",
    date: "2026",
    link: "https://www.cigversailles.fr/recherche?input-search-form=infographie&search_terms=&sort_bef_combine=relevance_DESC",
    pdfUrl: "https://www.cigversailles.fr/ged/espace-documentaire-cig/relation-agent-employeur/mediation/infographie-les-etapes-de-la-mediation",
    imageUrl: "https://www.cig929394.fr/wp-content/uploads/2025/03/Infographie_Cumul_activites_2025_03-1-pdf.jpg",
    icon: "⚖️",
    badge: "Guide de Procédure",
    tags: ["Infographie", "CIG Versailles", "Médiation", "MPO"]
  },
  {
    id: "versailles-info-3",
    title: "Le Congé Maladie Ordinaire des contractuels (infographie)",
    description: "Synthèse des droits selon l'ancienneté de service : plein traitement, demi-traitement, indemnités journalières de sécurité sociale (IJSS) et subrogation.",
    category: "Santé & Arrêts",
    cdg: "CIG GRANDE COURONNE (VERSAILLES)",
    dept: "78",
    date: "2026",
    link: "https://www.cigversailles.fr/recherche?input-search-form=infographie&search_terms=&sort_bef_combine=relevance_DESC",
    pdfUrl: "https://www.cigversailles.fr/ged/espace-documentaire-cig/expertise-statutaire/conseil-medical-unique-cmu/infographie-le-conseil-medical-2",
    imageUrl: "https://www.cig929394.fr/wp-content/uploads/2025/02/Infographie_CMO_2025_02-1-pdf.jpg",
    icon: "🩺",
    badge: "Barème Droits Contractuels",
    tags: ["Infographie", "CIG Versailles", "Contractuels", "CMO"]
  },
  {
    id: "versailles-info-4",
    title: "Gestion d'un Congé Maladie Ordinaire des fonctionnaires (infographie)",
    description: "Schéma de décompte à l'année glissante des 365 jours, passage à demi-traitement au 91ème jour, avis médical et reprise d'activité.",
    category: "Santé & Arrêts",
    cdg: "CIG GRANDE COURONNE (VERSAILLES)",
    dept: "78",
    date: "2026",
    link: "https://www.cigversailles.fr/recherche?input-search-form=infographie&search_terms=&sort_bef_combine=relevance_DESC",
    pdfUrl: "https://www.cigversailles.fr/ged/espace-documentaire-cig/expertise-statutaire/conseil-medical-unique-cmu/infographie-le-conseil-medical-1",
    imageUrl: "https://www.cig929394.fr/wp-content/uploads/2025/02/Infographie_CMO_2025_02-1-pdf.jpg",
    icon: "🩺",
    badge: "Arbre Décisionnel",
    tags: ["Infographie", "CIG Versailles", "Fonctionnaires", "CMO"]
  },
  {
    id: "versailles-info-5",
    title: "Procédure de reconnaissance d'une maladie professionnelle (infographie)",
    description: "Démarches déclaratives, enquête administrative, saisine de la commission de réforme/formation plénière du conseil médical et prise en charge CITIS.",
    category: "Santé & Arrêts",
    cdg: "CIG GRANDE COURONNE (VERSAILLES)",
    dept: "78",
    date: "2026",
    link: "https://www.cigversailles.fr/recherche?input-search-form=infographie&search_terms=&sort_bef_combine=relevance_DESC",
    pdfUrl: "https://www.cigversailles.fr/ged/espace-documentaire-cig/expertise-statutaire/conseil-medical-unique-cmu/procedure-de-reconnaissance-d-une-maladie",
    imageUrl: "https://www.cig929394.fr/wp-content/uploads/2025/07/Infographie-CIGPC_Regles_generales_classement_nomination_stagiaire_Categorie_A_page_1-pdf.jpg",
    icon: "🏥",
    badge: "Schéma Procédure CITIS",
    tags: ["Infographie", "CIG Versailles", "CITIS", "Maladie pro"]
  },
  {
    id: "versailles-info-6",
    title: "Procédure de reconnaissance d'un accident de trajet (infographie)",
    description: "Déclaration sous 48h, certificat médical initial, présomption d'imputabilité, trajet protégé entre domicile et lieu de travail.",
    category: "Santé & Arrêts",
    cdg: "CIG GRANDE COURONNE (VERSAILLES)",
    dept: "78",
    date: "2026",
    link: "https://www.cigversailles.fr/recherche?input-search-form=infographie&search_terms=&sort_bef_combine=relevance_DESC",
    pdfUrl: "https://www.cigversailles.fr/ged/espace-documentaire-cig/expertise-statutaire/conseil-medical-unique-cmu/procedure-de-reconnaissance-d-un-accident-de-0",
    imageUrl: "https://www.cig929394.fr/wp-content/uploads/2025/07/Infographie-CIGPC_Regles_generales_classement_nomination_stagiaire_Categorie_B-NES_page_1-pdf.jpg",
    icon: "🚑",
    badge: "Guide d'Urgence RH",
    tags: ["Infographie", "CIG Versailles", "Accident de trajet", "CITIS"]
  }
];

// Merge unique by title or pdfUrl
const merged = [...newInfographies];
for (const item of currentList) {
  if (!merged.find(m => m.title === item.title || m.pdfUrl === item.pdfUrl)) {
    merged.push(item);
  }
}

console.log(`Total merged infographies: ${merged.length}`);

const saveTargets = [
  path.join(__dirname, 'infographies.json'),
  path.join(__dirname, '..', 'infographies.json'),
  path.join(__dirname, '..', 'frontend', 'public', 'infographies.json'),
  path.join(__dirname, '..', 'api', 'infographies.json')
];

const jsonStr = JSON.stringify(merged, null, 2);
for (const t of saveTargets) {
  fs.writeFileSync(t, jsonStr, 'utf8');
  console.log(`Saved updated infographies to ${t}`);
}
