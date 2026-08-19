const axios = require('axios');
const cheerio = require('cheerio');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function check58And62() {
    console.log("=== Checking CDG 58 domains ===");
    for (const url of ['https://cdg58.fr', 'http://cdg58.fr', 'https://www.cdg-58.fr', 'http://www.cdg-58.fr', 'https://58.cdgplus.fr']) {
        try {
            const res = await axios.get(url, { timeout: 4000 });
            console.log(`SUCCESS 58: ${url} -> status ${res.status}`);
        } catch(e) {
            console.log(`FAIL 58: ${url} -> ${e.message}`);
        }
    }

    console.log("\n=== Checking CDG 62 domains ===");
    for (const url of ['https://www.cdg62.fr', 'http://www.cdg62.fr', 'https://cdg62.fr', 'https://www.cdg62.org', 'http://www.cdg62.org']) {
        try {
            const res = await axios.get(url, { timeout: 4000 });
            console.log(`SUCCESS 62: ${url} -> status ${res.status}`);
        } catch(e) {
            console.log(`FAIL 62: ${url} -> ${e.message}`);
        }
    }
}

async function checkSpecificSelectors() {
    console.log("\n=== Checking CDG 46 Titles ===");
    try {
        const { data } = await axios.get('https://www.cdg46.fr/actualites');
        const $ = cheerio.load(data);
        $('.views-row, article, .item, .actu, .card').each((i, el) => {
            const title = $(el).find('h1, h2, h3, h4, .title, .views-field-title').text().trim().replace(/\s+/g, ' ');
            const link = $(el).find('a').attr('href');
            if (title && link) console.log(`46: [${title}] -> ${link}`);
        });
    } catch(e) { console.log('46 err', e.message); }

    console.log("\n=== Checking CDG 74 Titles ===");
    try {
        const { data } = await axios.get('https://www.cdg74.fr/actualites/');
        const $ = cheerio.load(data);
        $('article, .item, .col-md-4, .actu-item').each((i, el) => {
            const title = $(el).find('h2, h3, h4, .entry-title, .title').text().trim().replace(/\s+/g, ' ');
            const link = $(el).find('a').attr('href');
            if (title && link) console.log(`74: [${title}] -> ${link}`);
        });
    } catch(e) { console.log('74 err', e.message); }

    console.log("\n=== Checking CDG 63 Titles ===");
    try {
        const { data } = await axios.get('https://www.cdg63.fr/connaitre-le-cdg-63/actualites/');
        const $ = cheerio.load(data);
        $('article, .actu-card, .card, .views-row, .wp-block-post').each((i, el) => {
            const title = $(el).find('h2, h3, h4, .entry-title').text().trim().replace(/\s+/g, ' ');
            const link = $(el).find('a').attr('href');
            if (title && link) console.log(`63: [${title}] -> ${link}`);
        });
    } catch(e) { console.log('63 err', e.message); }

    console.log("\n=== Checking CDG 61 Titles ===");
    try {
        const { data } = await axios.get('https://www.cdg61.fr/cdg61_toutes_actualites.php');
        const $ = cheerio.load(data);
        $('a[href*="actualites_"]').each((i, el) => {
            const title = $(el).text().trim().replace(/\s+/g, ' ');
            const link = $(el).attr('href');
            if (title && link) console.log(`61: [${title}] -> https://www.cdg61.fr/${link}`);
        });
    } catch(e) { console.log('61 err', e.message); }

    console.log("\n=== Checking CDG 01 page-1091 ===");
    try {
        const { data } = await axios.get('https://cdg01.fr/page-1091');
        const $ = cheerio.load(data);
        $('div, p, li, section').each((i, el) => {
            const t = $(el).text().trim();
            if (t.includes('Flash info') || t.includes('Actualité') || t.includes('2026') || t.includes('Circulaire')) {
                const a = $(el).find('a');
                if (a.length > 0) {
                    console.log(`01 item: [${a.text().trim()}] -> ${a.attr('href')}`);
                }
            }
        });
    } catch(e) { console.log('01 err', e.message); }
}

async function main() {
    await check58And62();
    await checkSpecificSelectors();
}

main();
