const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const urls = {
    '01': 'https://cdg01.fr/section-216',
    '07': 'https://www.cdg07.com/actualites/',
    '09': 'https://www.cdg09.fr/actualites/',
    '12': 'https://www.cdg12.fr/actualites/',
    '16': 'https://www.cdg16.fr/copie-de-actualites/',
    '18': 'https://www.cdg18.fr/le-cdg18/actualites.html#c3088',
    '27': 'https://www.cdg27.fr/missions-et-actualites-du-cdg27/actualites-et-informations-du-cdg27/actualites/',
    '31': 'https://www.cdg31.fr/actualites',
    '34': 'https://www.cdg34.fr/actualites/',
    '37': 'https://www.cdg37.fr/actualites/',
    '43': 'https://www.cdg43.fr/actualites/',
    '46': 'https://www.cdg46.fr/actualites',
    '47': 'https://www.cdg47.fr/actualites.php',
    '48': 'https://www.cdg48.fr/toute-lactualite-du-centre-de-gestion/',
    '65': 'https://www.cdg65.fr/actualites/'
};

async function testCDG(num, url) {
    console.log(`\n--- Testing ${num} ---`);
    let urlObj;
    try {
        urlObj = new URL(url);
    } catch(e) {
        urlObj = new URL('https://www.cdg'+num+'.fr');
    }
    
    // Test RSS
    try {
        const feedUrl = urlObj.origin + '/feed/';
        const feed = await parser.parseURL(feedUrl);
        if (feed.items && feed.items.length > 0) {
            console.log(`[RSS SUCCESS] Found ${feed.items.length} items`);
            console.log(feed.items.slice(0, 2).map(i => i.title));
            return;
        }
    } catch (e) {
        // RSS Failed
    }
    
    // Test HTML
    try {
        const { data } = await axios.get(url, { timeout: 8000 });
        const $ = cheerio.load(data);
        
        // 1. CDG 47 might be actualites.php?num= like 24
        const linksCustom = [];
        $('a[href^="actualites.php?num="], a[href^="?num="]').each((i, el) => {
             linksCustom.push($(el).text().trim() || 'Link');
        });
        if (linksCustom.length > 0) {
             console.log(`[HTML CUSTOM SUCCESS] Found actualites.php?num=`);
             console.log(linksCustom.slice(0,2));
             return;
        }
        
        // 2. Generic headings
        const articles = [];
        $('h1, h2, h3, h4, .actu, .news, article').find('a').each((i, el) => {
             const text = $(el).text().trim();
             if (text.length > 10) articles.push(text);
        });
        
        if (articles.length > 0) {
            console.log(`[HTML GENERIC SUCCESS] Found heading links`);
            console.log([...new Set(articles)].slice(0, 3));
        } else {
            console.log(`[HTML FAILED] No clear articles found. Checking all links...`);
            const allLinks = [];
            $('a').each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > 15) allLinks.push(text);
            });
            console.log(allLinks.slice(0, 3));
        }
    } catch (e) {
        console.log(`[ERROR] ${e.message}`);
    }
}

async function run() {
    for (const [num, url] of Object.entries(urls)) {
        await testCDG(num, url);
    }
}

run();
