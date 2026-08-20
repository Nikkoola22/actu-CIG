const fs = require('fs');
const path = require('path');

const infographies = JSON.parse(fs.readFileSync(path.join(__dirname, 'infographies.json'), 'utf8'));
const dataJsonPath = path.join(__dirname, 'data.json');
const allData = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));

// Attach CDG 17 infographics to CDG 17
const cdg17Infos = infographies.filter(i => i.dept === '17').map(i => ({
  title: i.title,
  link: i.pdfUrl || i.link,
  pubDate: new Date().toISOString(),
  source: 'Infographie CDG17'
}));

const idx17 = allData.findIndex(d => d.cdg.includes('17') || d.cdg.includes('CHARENTE-MARITIME'));
if (idx17 >= 0) {
  const existing = allData[idx17].news || [];
  allData[idx17].news = [...cdg17Infos, ...existing.filter(e => !cdg17Infos.find(c => c.link === e.link))];
}

// Attach CIG Versailles infographics to CIG Versailles
const versaillesInfos = infographies.filter(i => i.dept === '78').map(i => ({
  title: i.title,
  link: i.pdfUrl || i.link,
  pubDate: new Date().toISOString(),
  source: 'Infographie CIG Versailles'
}));

const idxVersailles = allData.findIndex(d => d.cdg.includes('VERSAILLES') || d.cdg.includes('78'));
if (idxVersailles >= 0) {
  const existing = allData[idxVersailles].news || [];
  allData[idxVersailles].news = [...versaillesInfos, ...existing.filter(e => !versaillesInfos.find(c => c.link === e.link))];
}

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
