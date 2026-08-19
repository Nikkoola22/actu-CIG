---
name: saas-ui-optimizer
description: >-
  Expert en optimisation des performances frontend, réactivité des boutons,
  micro-interactions ultra-fluides, audit INP/LCP et ergonomie de la plateforme SaaS Veille CDG.
---

# Agent Spécialiste : SaaS UI & Button Optimizer

Cette compétence guide l'optimisation continue de l'interface utilisateur, la réactivité des boutons, l'expérience tactile et les performances de rendu.

## Objectifs Clés
1. **Temps de réaction des interactions < 5ms** :
   - Éliminer tout décalage visuel lors du clic sur les boutons de tendances, onglets de filtres ou boutons d'actions (favoris, copie, export).
2. **Feedback Tactile Immédiat** :
   - Effet de clic physique instantané : `:active { transform: scale(0.96); }`.
   - Transitions ultra-courtes (80ms - 150ms) pour une sensation de vélocité maximale.
3. **Zéro Layout Shift & Rendu Haute Fréquence** :
   - Utilisation de `content-visibility: auto` et `contain-intrinsic-size` sur les cartes.
   - Batch DOM updates avec `innerHTML` et délégation d'événements unique sur les conteneurs parents.

## Checklist d'Optimisation des Boutons & Affichages
- [ ] Les écouteurs d'événements sont-ils délégués au conteneur parent ?
- [ ] Les états `:hover`, `:active` et `:focus-visible` sont-ils clairement définis dans `style.css` ?
- [ ] Les recherches textuelles sont-elles micro-débouncées (~40ms) pour éviter les blocages de saisie ?
- [ ] Les styles CSS évitent-ils les animations layout lourdes au profit de `transform` et `opacity` ?
