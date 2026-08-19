const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const targets = {
    '01': 'https://cdg01.fr/page-1091',
    '18': 'https://www.cdg18.fr/le-cdg18/actualites.html',
    '27': 'https://www.cdg27.fr/missions-et-actualites-du-cdg27/actualites-et-informations-du-cdg27/actualites/',
    '74': 'https://www.cdg74.fr/actualites/',
    '58': 'https://www.cdg58.fr/actualites/',
    '60': 'https://www.cdg60.com/actualites/',
    '61': 'https://www.cdg61.fr/cdg61_toutes_actualites.php',
    '62': 'https://www.cdg62.fr/actualites/',
    '63': 'https://www.cdg63.fr/connaitre-le-cdg-63/actualites/',
    '37': 'https://www.cdg37.fr/actualites/',
    '46': 'https://www.cdg46.fr/actualites',
    '66': 'https://cdg66.fr/toutes-les-actualites/',
    '81': 'https://cdg81.fr/actualites/'
};

async function testDept(code, url) {
    console.log(`\n================ Testing ${code} (${url}) ================`);
    
    // 1. Test RSS / Feed
    try {
        const u = new URL(url);
        const feedUrl = u.origin + '/feed/';
        const feed = await parser.parseURL(feedUrl);
        if (feed.items && feed.items.length > 0) {
            console.log(`[RSS /feed/ SUCCESS] (${feed.items.length} items)`);
            console.log(feed.items.slice(0, 3).map(i => ({ title: i.title, link: i.link })));
            return;
        }
    } catch(e) {
        // console.log(`  RSS /feed/ error: ${e.message}`);
    }

    // 2. Test Direct HTML
    try {
        const { data, request } = await axios.get(url, { 
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        
        console.log(`  Page title: $('title').text(): ${$('title').text().trim()}`);
        console.log(`  Final URL: ${request?.res?.responseUrl || url}`);

        // Try multiple selectors
        const found = [];
        
        // Strategy A: Post titles & Elements
        $('.elementor-post__title a, .post-title a, .entry-title a, h2 a, h3 a, h4 a, .card-title a, article a, .actu a, .news a, .views-field-title a').each((i, el) => {
            const title = $(el).text().trim().replace(/\s+/g, ' ');
            const href = $(el).attr('href');
            if (title.length > 8 && href && !found.find(f => f.link === href)) {
                found.push({ title, link: href, strategy: 'headings' });
            }
        });

        // Strategy B: PHP news or specific query parameters
        $('a[href*="actualite"], a[href*="actu"], a[href*="article"], a[href*="detail"]').each((i, el) => {
            const title = $(el).text().trim().replace(/\s+/g, ' ');
            const href = $(el).attr('href');
            if (title.length > 8 && href && !found.find(f => f.link === href)) {
                found.push({ title, link: href, strategy: 'href-match' });
            }
        });

        if (found.length > 0) {
            console.log(`[HTML SUCCESS] Found ${found.length} articles:`);
            console.log(found.slice(0, 4));
        } else {
            console.log(`[HTML EMPTY] No articles found with standard selectors. Sample links on page:`);
            const sampleLinks = [];
            $('a').each((i, el) => {
                const t = $(el).text().trim().replace(/\s+/g, ' ');
                const h = $(el).attr('href');
                if (t.length > 15 && h && h !== '#' && !h.startsWith('javascript')) {
                    sampleLinks.push({ text: t, href: h });
                }
            });
            console.log(sampleLinks.slice(0, 5));
        }

    } catch(e) {
        console.log(`[REQUEST ERROR]: ${e.message}`);
    }
}

async function run() {
    for (const [code, url] of Object.entries(targets)) {
        await testDept(code, url);
    }
}

run();
