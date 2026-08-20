const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'infographies.json');
const rawList = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Filter out generic annual reports or non-infographic magazine numbers, keep only authentic infographics & visual guides
const filtered = rawList.filter(item => {
  const t = item.title.toLowerCase();
  if (t.includes('l\'essentiel n°') || t.includes('synthèse d\'activités') || t.includes('regards croisés') || t.includes('panorama de l\'emploi territorial 2019') || t.includes('panorama de l\'emploi territorial 2021')) {
    return false;
  }
  return true;
});

console.log(`Cleaned infographics: ${filtered.length} high-value items.`);

const saveTargets = [
  path.join(__dirname, 'infographies.json'),
  path.join(__dirname, '..', 'infographies.json'),
  path.join(__dirname, '..', 'frontend', 'public', 'infographies.json'),
  path.join(__dirname, '..', 'api', 'infographies.json')
];

const jsonStr = JSON.stringify(filtered, null, 2);
for (const t of saveTargets) {
  fs.writeFileSync(t, jsonStr, 'utf8');
  console.log(`Saved to ${t}`);
}
