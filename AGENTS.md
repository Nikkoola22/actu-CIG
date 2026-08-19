# Directives et Standards du Projet Veille CDG PRO

Bienvenue sur le projet **Veille CDG PRO**. Ce projet est une plateforme SaaS d'intelligence territoriale et RH pour les Centres de Gestion de la Fonction Publique Territoriale (FPT).

## Architecture du Projet
- **Frontend** : Application ultra-rapide basée sur Vite, Vanilla JS moderne, et Vanilla CSS moderne (design système sur mesure, mode sombre/clair, design tokens).
- **Backend & Scraping** : Node.js (Express, Cheerio, Axios, RSS-Parser) pour le scraping automatique et ciblé des 86+ Centres de Gestion.
- **Automatisation & CI/CD** : GitHub Actions ([.github/workflows/scrape-cron.yml](file:///Users/nikkoola/Downloads/actu-CIG-main/.github/workflows/scrape-cron.yml)) et déploiement Vercel.

## Compétences & Agents Spécialisés Disponibles
1. **`saas-ui-optimizer`** : Expert en optimisation des performances frontend, réactivité des boutons (< 5ms), animations GPU, micro-interactions et accessibilité.
2. **`cdg-scraper-manager`** : Expert en scraping résilient des sites de CDGs, extraction de flux RSS, gestion des fallbacks et synchronisation des données `data.json`.

## Règles Fondamentales d'Ingénierie UI & Performance
1. **Réactivité Maximale des Boutons & Filtres** :
   - Tout clic ou action utilisateur doit réagir **instantanément** (< 10ms).
   - Toujours utiliser la génération HTML par lot (*Batch HTML*) et la délégation d'événements (*Event Delegation*).
   - Interdiction formelle de créer des écouteurs `addEventListener` individuels dans des boucles de rendu.
   - Pré-indexer toutes les métadonnées de filtrage en mémoire (mots-clés des tendances, minuscules, compteurs) lors de l'initialisation.

2. **Esthétique & Ergonomie Tactile** :
   - Tous les boutons et puces interactifs doivent disposer d'un feedback tactile immédiat (`:hover`, `:active { transform: scale(0.96) }`, `:focus-visible`).
   - Utiliser `content-visibility: auto` sur les listes longues pour maintenir un scroll à 60/120 FPS.
