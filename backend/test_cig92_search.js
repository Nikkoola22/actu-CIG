const axios = require('axios');
const cheerio = require('cheerio');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fetchCig929394Infographies() {
  console.log('Fetching https://www.cig929394.fr/?s=infographie ...');
  try {
    const res = await axios.get('https://www.cig929394.fr/?s=infographie', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    });

    console.log('HTTP Status:', res.status);
    console.log('Data length:', res.data.length);
    const $ = cheerio.load(res.data);
    const results = [];

    // Let's inspect articles / search results on WordPress/Drupal structure of cig929394.fr
    $('article, .search-result, .views-row, .entry, .post, .teaser, .item, .c-card, .actualite').each((i, el) => {
      const a = $(el).find('h2 a, h3 a, h1 a, a').first();
      let title = $(el).find('h2, h3, h1, .title, .entry-title').first().text().trim() || a.text().trim();
      let link = a.attr('href');
      let desc = $(el).find('p, .excerpt, .summary, .description, .field-content').not('h2, h3').first().text().trim();
      let img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

      title = title.replace(/\s+/g, ' ');
      desc = desc.replace(/\s+/g, ' ');

      if (link && title && title.length > 5 && !title.includes('Menu') && !title.includes('Rechercher')) {
        if (!link.startsWith('http')) link = 'https://www.cig929394.fr' + (link.startsWith('/') ? '' : '/') + link;
        if (img && !img.startsWith('http')) img = 'https://www.cig929394.fr' + (img.startsWith('/') ? '' : '/') + img;
        if (!results.find(r => r.link === link || r.title === title)) {
          results.push({ title, link, desc, img });
        }
      }
    });

    console.log(`Found ${results.length} items from selectors:`);
    console.log(JSON.stringify(results.slice(0, 10), null, 2));

    // Also look for all links that contain "infographie" or are inside the main content
    if (results.length === 0) {
      $('a').each((i, el) => {
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        const href = $(el).attr('href');
        if (href && (href.includes('infographie') || text.toLowerCase().includes('infographie'))) {
          console.log('Found link:', text, '->', href);
        }
      });
    }
  } catch(e) {
    console.error('Error fetching cig929394:', e.message);
  }
}

fetchCig929394Infographies();
