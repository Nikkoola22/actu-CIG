const fs = require('fs');
const path = require('path');

const infographies = JSON.parse(fs.readFileSync(path.join(__dirname, 'infographies.json'), 'utf8'));
const dataJsonPath = path.join(__dirname, 'data.json');
const allData = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));

// Format the CIG 92-93-94 infographics as news publications too
const cig92Infographies = infographies.filter(i => i.dept === '92').map(i => ({
  title: i.title,
  link: i.link,
  pubDate: new Date().toISOString(),
  source: 'Infographie Officielle'
}));

// Find CIG 92
const idx92 = allData.findIndex(d => d.cdg.includes('PETITE COURONNE') || d.cdg.includes('92'));
if (idx92 >= 0) {
  // Combine unique news
  const existing = allData[idx92].news || [];
  const combined = [...cig92Infographies, ...existing.filter(e => !cig92Infographies.find(c => c.link === e.link))];
  allData[idx92].news = combined;
  console.log(`Updated CIG 92 with ${combined.length} publications including infographics.`);
}

// Save to all target files
const saveTargets = [
  path.join(__dirname, 'data.json'),
  path.join(__dirname, '..', 'data.json'),
  path.join(__dirname, '..', 'frontend', 'public', 'data.json'),
  path.join(__dirname, '..', 'api', 'data.json')
];

const jsonStr = JSON.stringify(allData, null, 2);
for (const t of saveTargets) {
  fs.writeFileSync(t, jsonStr, 'utf8');
  console.log(`Saved updated data.json to ${t}`);
}
