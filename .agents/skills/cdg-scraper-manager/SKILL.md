---
name: cdg-scraper-manager
description: >-
  Expert en gestion, diagnostic et enrichissement du pipeline de scraping des 86+ Centres de Gestion (CDG).
---

# Agent Spécialiste : CDG Scraper & Pipeline Manager

Cette compétence guide la maintenance, le débogage et l'exécution résiliente du scraping des flux d'actualités territoriales.

## Architecture de Scraping
- **`backend/scraper.js`** : Scraper général d'exploration des annuaires FNCDG et flux RSS.
- **`backend/scrape_empty_cdgs.js`** : Scraper ciblé avec sélecteurs HTML et URLs sur-mesure pour les CDGs récalcitrants.
- **`.github/workflows/scrape-cron.yml`** : Workflow automatisé quotidien (06:00 UTC) exécuté sur GitHub Actions.

## Procédure de Synchronisation des Données
Quand des données sont modifiées ou générées par un scraper :
```bash
# 1. Copier vers tous les points de consommation
cp backend/data.json frontend/public/data.json
cp backend/data.json api/data.json
cp backend/data.json data.json

# 2. Pousser sur GitHub pour déploiement Vercel
git add backend/data.json frontend/public/data.json api/data.json data.json
git commit -m "chore(data): synchronisation des actualités"
git push
```
