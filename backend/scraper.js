const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();
const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DIRECTORY_URL = 'https://fncdg.com/annuaire_cdg/';

const KNOWN_URLS = {
    '01': 'https://cdg01.fr/section-216',
    '04': 'https://cdg04.fr/actualites/',
    '07': 'https://www.cdg07.com/actualites/',
    '09': 'https://www.cdg09.fr/actualites/',
    '12': 'https://www.cdg12.fr/actualites/',
    '67': 'https://www.cdg67.fr/actualites/',
    '15': 'https://www.cdg15.fr/2024/index.php/home/actualites-du-cdg/',
    '16': 'https://www.cdg16.fr/copie-de-actualites/',
    '18': 'https://www.cdg18.fr/le-cdg18/actualites.html#c3088',
    '79': 'https://www.cdg79.fr/actualites',
    '19': 'https://www.cdg19.fr/',
    '23': 'https://www.cdg23.fr/',
    '24': 'https://www.cdg24.fr/actualites.php',
    '27': 'https://www.cdg27.fr/missions-et-actualites-du-cdg27/actualites-et-informations-du-cdg27/actualites/',
    '28': 'https://www.cdg28.fr/',
    '30': 'https://www.cdg30.fr/a-la-une',
    '33': 'https://www.cdg33.fr/cdg-33/actualites/',
    '34': 'https://www.cdg34.fr/actualites/',
    '37': 'https://www.cdg37.fr/actualites/',
    '68': 'https://www.cdg68.fr/categories/actualites/',
    '31': 'https://www.cdg31.fr/actualites',
    '43': 'https://www.cdg43.fr/actualites/',
    '88': 'https://88.cdgplus.fr/liste-des-actualites/',
    '81': 'https://cdg81.fr/actualites/',
    '76': 'https://www.cdg76.fr/actualites-juridiques',
    '73': 'https://www.cdg73.fr/actualites/',
    '66': 'https://cdg66.fr/toutes-les-actualites/',
    '65': 'https://www.cdg65.fr/actualites/',
    '63': 'https://www.cdg63.fr/connaitre-le-cdg-63/actualites/',
    '62': 'https://www.cdg62.fr/actualites/',
    '61': 'https://www.cdg61.fr/cdg61_toutes_actualites.php',
    '60': 'https://www.cdg60.com/actualites/',
    '58': 'https://www.cdg58.fr/actualites/',
    '57': 'https://www.cdg57.fr/le-centre-de-gestion/actualites/',
    '55': 'https://www.cdg55.fr/actualites/',
    '54': 'https://www.cdg54.fr/actualites/',
    '51': 'https://51.cdgplus.fr/category/actualites/',
    '48': 'https://www.cdg48.fr/toute-lactualite-du-centre-de-gestion/',
    '47': 'https://www.cdg47.fr/actualites.php',
    '46': 'https://www.cdg46.fr/actualites',
    '40': 'https://www.cdg40.fr/actualites.php'
};

async function getCDGLinks() {
    try {
        const { data } = await axios.get(DIRECTORY_URL);
        const $ = cheerio.load(data);
        const cdgs = [];
        
        // Find links in the main content area that look like CDG subpages
        $('#content a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            // A typical CDG link has parentheses with department number, e.g., (01) AIN
            if (href && href.includes('/annuaire_cdg/') && href !== DIRECTORY_URL && text.match(/\(\d{2}[A-B]?\)/)) {
                cdgs.push({ name: text, url: href });
            }
        });
        
        // Remove duplicates just in case
        return [...new Map(cdgs.map(item => [item.url, item])).values()];
    } catch (error) {
        console.error('Error fetching directory:', error.message);
        return [];
    }
}

async function getOfficialWebsiteUrl(subpageUrl) {
    try {
        const { data } = await axios.get(subpageUrl);
        const $ = cheerio.load(data);
        let website = null;
        
        $('#content a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('http') && !href.includes('fncdg.com')) {
                website = href;
            }
        });
        
        return website;
    } catch (error) {
        // console.error(`Error fetching subpage ${subpageUrl}:`, error.message);
        return null;
    }
}

async function scrapeNewsFromWebsite(websiteUrl) {
    // Attempt 1: RSS Feed
    try {
        const { data } = await axios.get(websiteUrl, { timeout: 5000 });
        const $ = cheerio.load(data);
        let rssUrl = null;
        
        $('link[type="application/rss+xml"]').each((i, el) => {
            rssUrl = $(el).attr('href');
        });
        
        if (!rssUrl && $('link[type="application/atom+xml"]').length > 0) {
            rssUrl = $('link[type="application/atom+xml"]').first().attr('href');
        }

        if (rssUrl) {
            if (!rssUrl.startsWith('http')) {
                const urlObj = new URL(websiteUrl);
                rssUrl = urlObj.origin + (rssUrl.startsWith('/') ? '' : '/') + rssUrl;
            }
            
            const feed = await parser.parseURL(rssUrl);
            if (feed.items && feed.items.length > 0) {
                return feed.items.slice(0, 3).map(item => ({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    source: 'RSS'
                }));
            }
        } else {
            // Explicit fallback for WordPress /feed/
            try {
                const urlObj = new URL(websiteUrl);
                const explicitFeedUrl = urlObj.origin + '/feed/';
                const feed = await parser.parseURL(explicitFeedUrl);
                if (feed.items && feed.items.length > 0) {
                    return feed.items.slice(0, 3).map(item => ({
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate,
                        source: 'RSS'
                    }));
                }
            } catch (e) {
                // Ignore fallback
            }
        }
        
        // Custom Scrapers for Specific CDs
        if (websiteUrl.includes('cdg04.fr')) {
            const news04 = [];
            $('.pt-cv-title a').each((i, el) => {
                news04.push({ title: $(el).text().trim(), link: $(el).attr('href'), source: 'HTML' });
            });
            if (news04.length > 0) return news04.slice(0, 3);
        }
        
        if (websiteUrl.includes('cdg24.fr') || websiteUrl.includes('cdg19.fr') || websiteUrl.includes('cdg23.fr') || websiteUrl.includes('cdg47.fr')) {
            const newsCustom = [];
            const urlObj = new URL(websiteUrl);
            const baseOrigin = urlObj.origin + '/';
            $('a[href^="actualites.php?num="]').each((i, el) => {
                const text = $(el).text().trim() || 'Actualité';
                if (text.length > 5 && !newsCustom.find(n => n.link === baseOrigin + $(el).attr('href'))) {
                    newsCustom.push({ title: text, link: baseOrigin + $(el).attr('href'), source: 'HTML' });
                }
            });
            if (newsCustom.length > 0) return newsCustom.slice(0, 3);
        }
        
        // Remove old cdg33/28/68 hardcoded block as we generalized it

        // Attempt 2: HTML Heuristics (News links)
        const news = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            const parentHtml = $(el).parent().html() || '';
            const className = ($(el).attr('class') || '') + ' ' + ($(el).parent().attr('class') || '');
            
            // Check if it's a news link
            if (href && (
                href.includes('/actualites/') || 
                href.includes('/news/') || 
                className.toLowerCase().includes('actu') || 
                className.toLowerCase().includes('news')
            )) {
                if (text.length > 10 && !news.find(n => n.link === href)) {
                    let fullHref = href;
                    if (!fullHref.startsWith('http')) {
                        const urlObj = new URL(websiteUrl);
                        fullHref = urlObj.origin + (fullHref.startsWith('/') ? '' : '/') + fullHref;
                    }
                    news.push({
                        title: text,
                        link: fullHref,
                        source: 'HTML'
                    });
                }
            }
        });
        
        if (news.length > 0) {
            return news.slice(0, 3);
        }

        // Attempt 3: Aggressive CSS selectors for articles
        $('.elementor-post__title a, .post-title a, h2 a, h3 a, article a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (href && text.length > 10 && !news.find(n => n.link === href)) {
                let fullHref = href;
                if (!fullHref.startsWith('http')) {
                    const urlObj = new URL(websiteUrl);
                    fullHref = urlObj.origin + (fullHref.startsWith('/') ? '' : '/') + fullHref;
                }
                news.push({
                    title: text,
                    link: fullHref,
                    source: 'HTML Fallback'
                });
            }
        });

        if (news.length > 0) {
            return news.slice(0, 3);
        }
        
    } catch (error) {
        // Fallback silently
    }
    
    // Fallback: Just return the website URL
    return [{
        title: "Voir les actualités sur le site officiel",
        link: websiteUrl,
        source: 'Fallback'
    }];
}

async function runScraper() {
    console.log('Starting scraper...');
    const cdgs = await getCDGLinks();
    console.log(`Found ${cdgs.length} CDG subpages.`);
    
    // Process only first 5 to avoid taking hours during this test phase
    const results = [];
    const cdgsToProcess = cdgs; 
    
    for (const cdg of cdgsToProcess) {
        console.log(`Processing ${cdg.name}...`);
        
        let deptCode = null;
        const match = cdg.name.match(/\((\d{2}[A-B]?)\)/);
        if (match) deptCode = match[1];

        const officialUrl = await getOfficialWebsiteUrl(cdg.url);
        
        const scrapeUrl = (deptCode && KNOWN_URLS[deptCode]) ? KNOWN_URLS[deptCode] : officialUrl;

        if (scrapeUrl) {
            const news = await scrapeNewsFromWebsite(scrapeUrl);
            results.push({
                cdg: cdg.name,
                officialUrl,
                news
            });
        } else {
            results.push({
                cdg: cdg.name,
                officialUrl: null,
                news: []
            });
        }
    }
    
    fs.writeFileSync('data.json', JSON.stringify(results, null, 2));
    console.log('Scraping completed. Results saved to data.json');
}

module.exports = {
    runScraper
};

// If run directly
if (require.main === module) {
    runScraper();
}
