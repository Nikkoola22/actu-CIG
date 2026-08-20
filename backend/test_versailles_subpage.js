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
      res.on('end', () => resolve(data));
    });
    req.on('error', err => reject(err));
    req.end();
  });
}

async function testVersaillesSubpage() {
  const sample = 'https://www.cigversailles.fr/ged/espace-documentaire-cig/expertise-statutaire/conseil-medical-unique-cmu/infographie-le-conseil-medical';
  console.log('Fetching subpage:', sample);
  const html = await getRawHttps(sample);
  const $ = cheerio.load(html);

  const title = $('h1').text().trim();
  const desc = $('.field--name-field-texte-resume, .field--name-body, p').first().text().trim();
  const pdfLink = $('a[href$=".pdf"]').attr('href');
  const imgLink = $('img').first().attr('src');

  console.log('Title:', title);
  console.log('Desc:', desc);
  console.log('PDF:', pdfLink);
  console.log('Img:', imgLink);
}

testVersaillesSubpage();
