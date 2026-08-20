const https = require('https');
const cheerio = require('cheerio');
const { URL } = require('url');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function getRawHttps(urlStr) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const req = https.request({
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Host': parsed.hostname
      },
      insecureHTTPParser: true,
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, data }));
    });
    req.on('error', err => reject(err));
    req.end();
  });
}

async function test() {
  const res = await getRawHttps('https://www.cigversailles.fr/actualites');
  const $ = cheerio.load(res.data);
  const list = [];
  
  // Inspect views rows / article cards on Drupal
  $('.views-row, article.node--type-actualite, .view-actualites .views-row, .node--type-actualite, .field--name-node-title').each((i, el) => {
    const a = $(el).is('a') ? $(el) : $(el).find('a').first();
    const title = $(el).find('h2, h3, .field--name-node-title, a').first().text().trim();
    let href = a.attr('href');
    if (href && title && title.length > 8) {
      if (!href.startsWith('http')) href = 'https://www.cigversailles.fr' + href;
      list.push({ title: title.replace(/\s+/g, ' '), link: href });
    }
  });

  console.log('Versailles specific selector count:', list.length);
  const unique = [...new Map(list.map(item => [item.link, item])).values()];
  console.log('Versailles articles:', JSON.stringify(unique.slice(0, 10), null, 2));
}

test();
