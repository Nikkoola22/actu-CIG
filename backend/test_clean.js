const dns = require('dns');
const https = require('https');
const axios = require('axios');
const cheerio = require('cheerio');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const customLookup = (hostname, options, callback) => {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    if (hostname.includes('cdg62.fr')) {
        if (options && options.all) {
            return callback(null, [{ address: '213.186.33.16', family: 4 }]);
        }
        return callback(null, '213.186.33.16', 4);
    }
    return dns.lookup(hostname, options, callback);
};

const agent = new https.Agent({
    lookup: customLookup,
    rejectUnauthorized: false
});

const client = axios.create({
    httpsAgent: agent,
    timeout: 8000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
});

async function check62() {
    try {
        console.log("Testing 62 with https.Agent lookup...");
        const res = await client.get('https://www.cdg62.fr/toutes-les-actualites');
        const $ = cheerio.load(res.data);
        const results = [];
        $('a').each((i, el) => {
            const title = $(el).text().trim().replace(/\s+/g, ' ');
            const href = $(el).attr('href');
            if (title.length > 15 && href && !href.startsWith('#') && (title.includes('2026') || title.includes('CdG62') || href.includes('actualite') || href.includes('toutes-les-actualites'))) {
                if (!results.find(r => r.link === href)) {
                    let full = href.startsWith('http') ? href : 'https://www.cdg62.fr' + (href.startsWith('/') ? '' : '/') + href;
                    results.push({ title, link: full });
                }
            }
        });
        console.log(`CDG 62 Success! Found ${results.length} items:`, results.slice(0, 4));
    } catch(e) {
        console.log(`CDG 62 Error: ${e.message}`);
    }
}

check62();
