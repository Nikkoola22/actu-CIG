const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'infographies.json');
const infographies = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const detailedDescriptions = {
  'La procédure de réintégration de l’agent en congé parental – Infographie': 
    'Schéma des démarches et délais légaux pour la réintégration d\'un agent public après un congé parental : demande 2 mois avant, visite médicale de reprise, réaffectation dans l\'emploi ou sur un poste équivalent.',
  
  'La procédure de placement en congé parental – Infographie': 
    'Guide visuel étape par étape : conditions d\'ouverture des droits, demande initiale 1 mois avant la date souhaitée, durée par périodes de 2 à 6 mois renouvelables jusqu\'aux 3 ans de l\'enfant.',
  
  'La procédure de fin de détachement sur emploi fonctionnel de direction à l’initiative de l’employeur – Infographie': 
    'Procédure complète de décharge de fonctions : entretien préalable, information de l\'assemblée délibérante, préavis, indemnité de licenciement ou prise en charge par le CIG/CDG.',
  
  'La procédure de recrutement sur les emplois fonctionnels de direction – Infographie': 
    'Étapes et formalités obligatoires : déclaration de vacance d\'emploi, publication de l\'offre, examen des candidatures, audition et transmission au contrôle de légalité.',
  
  'Quand et comment placer un agent en période de préparation au reclassement (PPR) ? – infographie': 
    'Arbre décisionnel sur la PPR : constatation de l\'inaptitude par le Conseil médical, information de l\'agent, élaboration du projet personnalisé de reclassement et formation qualifiante sur 1 an maximum.',
  
  'Quand et comment placer un agent en disponibilité pour raison de santé (DORS) ? – infographie': 
    'Schéma de placement en DORS après épuisement des droits à congés de maladie (CMO, CLM, CLD) : durée, maintien du demi-traitement, indemnités journalières et perspectives de réintégration.',
  
  'Les règles générales de classement à la nomination stagiaire : Catégorie C – infographie': 
    'Barème et méthode de calcul pour la reprise des services antérieurs (secteur public et secteur privé) lors de la nomination en catégorie C.',
  
  'Les règles générales de classement à la nomination stagiaire : Catégorie B-NES – infographie': 
    'Guide visuel de classement dans le Nouvel Espace Statutaire (NES) : reprise des années d\'expérience professionnelle, diplômes et ancienneté.',
  
  'Les règles générales de classement à la nomination stagiaire : Catégorie A – Attachés territoriaux – infographie': 
    'Infographie synthétique sur les règles de calcul de l\'échelon d\'accueil pour le cadre d\'emplois des attachés territoriaux.',
  
  'Les principales règles de classement à la nomination stagiaire – infographie': 
    'Synthèse transversale des principes généraux applicables à toutes les catégories hiérarchiques (A, B, C) lors de la titularisation.',
  
  'Le cumul d’activités des agents publics – Infographie': 
    'Tableau et arbre décisionnel sur le régime des cumuls d\'activités : activités accessoires autorisées, création/reprise d\'entreprise, saisine du référent déontologue.',
  
  'Le congé de maladie ordinaire du fonctionnaire – infographie': 
    'Schéma complet sur les droits à CMO : décompte à l\'année glissante, 3 mois à plein traitement, 9 mois à demi-traitement, jour de carence et obligations de l\'agent.'
};

for (const item of infographies) {
  if (detailedDescriptions[item.title]) {
    item.description = detailedDescriptions[item.title];
  }
}

const saveTargets = [
  path.join(__dirname, 'infographies.json'),
  path.join(__dirname, '..', 'infographies.json'),
  path.join(__dirname, '..', 'frontend', 'public', 'infographies.json'),
  path.join(__dirname, '..', 'api', 'infographies.json')
];

const jsonStr = JSON.stringify(infographies, null, 2);
for (const t of saveTargets) {
  fs.writeFileSync(t, jsonStr, 'utf8');
  console.log(`Updated descriptions in ${t}`);
}
