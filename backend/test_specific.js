const axios = require('axios');
const cheerio = require('cheerio');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const targets = {
    '01': 'https://cdg01.fr/page-1091',
    '18': 'https://www.cdg18.fr/le-cdg18/actualites.html',
    '27': 'https://www.cdg27.fr/missions-et-actualites-du-cdg27/actualites-et-informations-du-cdg27/actualites/',
    '31': 'https://www.cdg31.fr/actualites',
    '70': 'https://70.cdgplus.fr/category/actualite/',
    '74': 'https://www.cdg74.fr/actualites/'
};

async function testUrl(cdg, url) {
    console.log(`\n=== Testing CDG ${cdg} ===`);
    try {
        const { data } = await axios.get(url, { timeout: 10000 });
        const $ = cheerio.load(data);
        
        const links = [];
        // Trying to print out the most prominent links
        $('h1 a, h2 a, h3 a, h4 a, .news a, .actu a, article a, .post-title a, .elementor-post__title a, .item-title a, .card-title a').each((i, el) => {
             const text = $(el).text().trim().replace(/\s+/g, ' ');
             const href = $(el).attr('href');
             if (text.length > 8 && href) {
                 links.push({text, href});
             }
        });
        
        if (links.length > 0) {
            console.log(`Found ${links.length} generic headings/articles:`);
            console.log(links.slice(0,3));
        } else {
            console.log("No standard headings found. Dumping all large links:");
            const all = [];
            $('a').each((i, el) => {
                 const text = $(el).text().trim().replace(/\s+/g, ' ');
                 const href = $(el).attr('href');
                 if (text.length > 20 && href && href !== '#') {
                     all.push({text, href});
                 }
            });
            console.log(all.slice(0, 5));
        }
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

async function run() {
    for (const [cdg, url] of Object.entries(targets)) {
        await testUrl(cdg, url);
    }
}

run();
