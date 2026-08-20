const axios = require('axios');
const cheerio = require('cheerio');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const sampleUrls = [
  'https://www.cig929394.fr/publications/la-procedure-de-reintegration-de-lagent-en-conge-parental-infographie/',
  'https://www.cig929394.fr/publications/la-procedure-de-placement-en-conge-parental-infographie/',
  'https://www.cig929394.fr/publications/la-procedure-de-fin-de-detachement-sur-emploi-fonctionnel-de-direction-a-linitiative-de-lemployeur-infographie/',
  'https://www.cig929394.fr/publications/la-procedure-de-recrutement-sur-les-emplois-fonctionnels-de-direction-infographie/',
  'https://www.cig929394.fr/publications/quand-et-comment-placer-un-agent-en-periode-de-preparation-au-reclassement-ppr-infographie/'
];

async function testPageImages() {
  for (const url of sampleUrls) {
    console.log('\n--- Fetching:', url);
    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 10000
      });
      const $ = cheerio.load(data);
      
      const images = [];
      $('article img, .entry-content img, .content img, main img, figure img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('srcset');
        if (src && !src.includes('logo') && !src.includes('avatar') && !src.includes('icon')) {
          images.push(src.split(' ')[0]);
        }
      });

      const pdfs = [];
      $('a[href$=".pdf"], a[href*="wp-content/uploads"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) pdfs.push(href);
      });

      console.log('Found Images:', images);
      console.log('Found PDFs/Downloads:', pdfs);
    } catch(e) {
      console.error('Error:', e.message);
    }
  }
}

testPageImages();
