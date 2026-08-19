const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const urls = {
    '88': 'https://88.cdgplus.fr/liste-des-actualites/',
    '81': 'https://cdg81.fr/actualites/',
    '73': 'https://www.cdg73.fr/actualites/',
    '72': 'https://www.cdg72.fr/actualites/',
    '66': 'https://cdg66.fr/toutes-les-actualites/',
    '61': 'https://www.cdg61.fr/cdg61_toutes_actualites.php',
    '62': 'https://www.cdg62.fr/actualites/',
    '63': 'https://www.cdg63.fr/connaitre-le-cdg-63/actualites/',
    '58': 'https://www.cdg58.fr/actualites/',
    '57': 'https://www.cdg57.fr/le-centre-de-gestion/actualites/',
    '55': 'https://www.cdg55.fr/actualites/',
    '54': 'https://www.cdg54.fr/actualites/',
    '48': 'https://www.cdg48.fr/toute-lactualite-du-centre-de-gestion/',
    '46': 'https://www.cdg46.fr/actualites'
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
        
        // Generic headings
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
                const href = $(el).attr('href') || '';
                if (text.length > 15 && (href.includes('actu') || href.includes('news'))) allLinks.push(text);
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
