const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();
const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DIRECTORY_URL = 'https://fncdg.com/annuaire_cdg/';

const KNOWN_URLS = {
    '01': 'https://cdg01.fr/page-1091',
    '04': 'https://cdg04.fr/actualites/',
    '07': 'https://www.cdg07.com/actualites/',
    '09': 'https://www.cdg09.fr/actualites/',
    '12': 'https://www.cdg12.fr/actualites/',
    '67': 'https://www.cdg67.fr/actualites/',
    '15': 'https://www.cdg15.fr/2024/index.php/home/actualites-du-cdg/',
    '16': 'https://www.cdg16.fr/copie-de-actualites/',
    '18': 'https://www.cdg18.fr/le-cdg18/actualites.html',
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
    '74': 'https://www.cdg74.fr/actualites/',
    '73': 'https://www.cdg73.fr/actualites/',
    '70': 'https://70.cdgplus.fr/category/actualite/',
    '66': 'https://cdg66.fr/toutes-les-actualites/',
    '65': 'https://www.cdg65.fr/actualites/',
    '63': 'https://www.cdg63.fr/connaitre-le-cdg-63/actualites/',
    '62': 'https://www.cdg62.fr/actualites/',
    '61': 'https://www.cdg61.fr/cdg61_toutes_actualites.php',
    '60': 'https://www.cdg60.com/actualites/',
    '58': 'https://www.cdg58.com/',
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
    try {
        const urlObj = new URL(websiteUrl);

        // --- SPECIFIC SCRAPERS ---
        // CDG 01 (Ain)
        if (websiteUrl.includes('cdg01.fr')) {
            try {
                const { data } = await axios.get('https://cdg01.fr/page-1091', { timeout: 8000 });
                const $ = cheerio.load(data);
                const news01 = [];
                $('a').each((i, el) => {
                    const text = $(el).text().trim().replace(/\s+/g, ' ');
                    const href = $(el).attr('href');
                    if (href && (text.includes('♦') || text.includes('2026') || text.includes('Décret') || href.includes('page-1200') || href.includes('page-1177') || href.includes('page-1201'))) {
                        if (text.length > 10 && text.length < 150 && !news01.find(r => r.link === href)) {
                            let link = href;
                            if (!link.startsWith('http')) link = 'https://www.cdg01.fr/' + link.replace(/^\.\.\//, '').replace(/^\//, '');
                            news01.push({ title: text, link, source: 'HTML (Spécifique)' });
                        }
                    }
                });
                if (news01.length > 0) return news01.slice(0, 3);
            } catch(e) {}
        }

        // CDG 18 (Cher)
        if (websiteUrl.includes('cdg18.fr')) {
            try {
                const { data } = await axios.get('https://www.cdg18.fr/le-cdg18/actualites.html', { timeout: 8000 });
                const $ = cheerio.load(data);
                const news18 = [];
                $('a').each((i, el) => {
                    const text = $(el).text().trim().replace(/\s+/g, ' ');
                    const href = $(el).attr('href');
                    if (href && (href.includes('Flash_Info') || text.includes('Flash info') || text.includes('Flash spécial'))) {
                        let link = href.startsWith('http') ? href : 'https://www.cdg18.fr/' + href.replace(/^\//, '');
                        if (!news18.find(r => r.link === link)) {
                            news18.push({ title: text, link, source: 'HTML (Spécifique)' });
                        }
                    }
                });
                if (news18.length > 0) return news18.slice(0, 3);
            } catch(e) {}
        }

        // CDG 46 (Lot)
        if (websiteUrl.includes('cdg46.fr')) {
            try {
                const { data } = await axios.get('https://www.cdg46.fr/actualites', { timeout: 8000 });
                const $ = cheerio.load(data);
                const news46 = [];
                $('a[href*="/detail/"]').each((i, el) => {
                    const href = $(el).attr('href');
                    const container = $(el).closest('.views-row, .col, .card, div, tr');
                    const heading = container.find('h1, h2, h3, h4, h5, strong, b, .title').first().text().trim().replace(/\s+/g, ' ');
                    const title = (heading && heading.length > 5) ? heading : $(el).text().trim().replace(/\s+/g, ' ');
                    if (title && title.length > 5 && !title.toLowerCase().includes('lire la suite')) {
                        let link = href.startsWith('http') ? href : 'https://www.cdg46.fr' + (href.startsWith('/') ? '' : '/') + href;
                        if (!news46.find(r => r.link === link)) {
                            news46.push({ title, link, source: 'HTML (Spécifique)' });
                        }
                    }
                });
                if (news46.length > 0) return news46.slice(0, 3);
            } catch(e) {}
        }

        // CDG 58 (Nièvre)
        if (websiteUrl.includes('cdg58.com') || websiteUrl.includes('cdg58.fr')) {
            try {
                const { data } = await axios.get('https://www.cdg58.com/', { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $ = cheerio.load(data);
                const news58 = [];
                $('a').each((i, el) => {
                    const href = $(el).attr('href');
                    const text = $(el).text().trim().replace(/\s+/g, ' ');
                    if (href && (href.includes('formation') || href.includes('elections') || href.includes('actus-') || text.includes('Formation') || text.includes('ÉLECTIONS') || text.includes('ELECTIONS'))) {
                        if (text.length > 10 && !news58.find(r => r.link === href)) {
                            let link = href.startsWith('http') ? href : 'https://www.cdg58.com' + (href.startsWith('/') ? '' : '/') + href;
                            news58.push({ title: text, link, source: 'HTML (Spécifique)' });
                        }
                    }
                });
                if (news58.length > 0) return news58.slice(0, 3);
            } catch(e) {}
        }

        // CDG 61 (Orne)
        if (websiteUrl.includes('cdg61.fr')) {
            try {
                const { data } = await axios.get('https://www.cdg61.fr/cdg61_toutes_actualites.php', { timeout: 8000 });
                const $ = cheerio.load(data);
                const news61 = [];
                $('a[href*="actualites_"]').each((i, el) => {
                    const text = $(el).text().trim().replace(/\s+/g, ' ');
                    const href = $(el).attr('href');
                    if (text && text.length > 15 && !text.toUpperCase().includes('ACTUALIT') && !news61.find(r => r.link === href)) {
                        let link = href.startsWith('http') ? href : 'https://www.cdg61.fr/' + href.replace(/^\//, '');
                        news61.push({ title: text, link, source: 'HTML (Spécifique)' });
                    }
                });
                if (news61.length > 0) return news61.slice(0, 3);
            } catch(e) {}
        }

        // CDG 52 (Haute-Marne)
        if (websiteUrl.includes('cdg52.fr')) {
            try {
                const { data } = await axios.get('https://www.cdg52.fr/', { timeout: 8000 });
                const $ = cheerio.load(data);
                const news52 = [];
                $('.actualite-mise-en-avant-accueil, .bloc-actu-teaser, .bloc-evenement-teaser').each((i, el) => {
                    let title = '';
                    let link = '';
                    $(el).find('a').each((j, a) => {
                        const h = $(a).attr('href');
                        const t = $(a).text().trim().replace(/\s+/g, ' ');
                        if (h && t && t.length > 8 && !t.toLowerCase().includes('lire') && !t.includes('<img')) {
                            if (!title) { title = t; link = h; }
                        }
                    });
                    if (!title) {
                        const imgAlt = $(el).find('img[alt]').attr('alt');
                        const h = $(el).find('a').first().attr('href');
                        if (imgAlt && imgAlt.trim().length > 8) {
                            title = imgAlt.trim();
                            link = h;
                        }
                    }
                    if (title && link && !news52.some(x => x.link === link)) {
                        news52.push({ title, link, source: 'HTML (Spécifique)' });
                    }
                });
                if (news52.length > 0) return news52.slice(0, 3);
            } catch(e) {}
        }

        // CDG 63 (Puy-de-Dôme)
        if (websiteUrl.includes('cdg63.fr')) {
            try {
                const { data } = await axios.get('https://www.cdg63.fr/connaitre-le-cdg-63/actualites/', { timeout: 8000 });
                const $ = cheerio.load(data);
                const news63 = [];
                $('article, .actu-card, .card, .wp-block-post, div').each((i, el) => {
                    const h = $(el).find('h2, h3, h4, .entry-title').first().text().trim().replace(/\s+/g, ' ');
                    const a = $(el).find('a[href*="/actus/"]').first().attr('href') || $(el).find('a').first().attr('href');
                    if (h && h.length > 8 && a && a.includes('/actus/') && !news63.find(r => r.link === a)) {
                        news63.push({ title: h, link: a, source: 'HTML (Spécifique)' });
                    }
                });
                if (news63.length > 0) return news63.slice(0, 3);
            } catch(e) {}
        }

        // CDG 74 (Haute-Savoie)
        if (websiteUrl.includes('cdg74.fr')) {
            try {
                const { data } = await axios.get('https://www.cdg74.fr/actualites/', { timeout: 8000 });
                const $ = cheerio.load(data);
                const news74 = [];
                $('article, .item, .col-md-4, .actu-item, div').each((i, el) => {
                    const h = $(el).find('h2, h3, h4, .entry-title, .title').first().text().trim().replace(/\s+/g, ' ');
                    const a = $(el).find('a[href*="cdg74.fr/"]').first().attr('href');
                    if (h && h.length > 10 && a && !a.includes('/actualites/') && !h.toLowerCase().includes('en savoir') && !h.toLowerCase().includes('par dates') && !news74.find(r => r.link === a)) {
                        news74.push({ title: h, link: a, source: 'HTML (Spécifique)' });
                    }
                });
                if (news74.length > 0) return news74.slice(0, 3);
            } catch(e) {}
        }

        // CDG 04
        if (websiteUrl.includes('cdg04.fr')) {
            const { data } = await axios.get(websiteUrl, { timeout: 8000 });
            const $ = cheerio.load(data);
            const news04 = [];
            $('.pt-cv-title a').each((i, el) => {
                news04.push({ title: $(el).text().trim(), link: $(el).attr('href'), source: 'HTML (Spécifique)' });
            });
            if (news04.length > 0) return news04.slice(0, 3);
        }
        
        // CDG 24, 19, 23, 47
        if (websiteUrl.includes('cdg24.fr') || websiteUrl.includes('cdg19.fr') || websiteUrl.includes('cdg23.fr') || websiteUrl.includes('cdg47.fr')) {
            const { data } = await axios.get(websiteUrl, { timeout: 8000 });
            const $ = cheerio.load(data);
            const newsCustom = [];
            const baseOrigin = urlObj.origin + '/';
            $('a[href^="actualites.php?num="]').each((i, el) => {
                const text = $(el).text().trim() || 'Actualité';
                if (text.length > 5 && !newsCustom.find(n => n.link === baseOrigin + $(el).attr('href'))) {
                    newsCustom.push({ title: text, link: baseOrigin + $(el).attr('href'), source: 'HTML (Spécifique)' });
                }
            });
            if (newsCustom.length > 0) return newsCustom.slice(0, 3);
        }
        
        // CDG 31
        if (websiteUrl.includes('cdg31.fr')) {
            try {
                const feed = await parser.parseURL('https://www.cdg31.fr/rss.xml');
                if (feed.items && feed.items.length > 0) {
                    return feed.items.slice(0, 3).map(item => ({
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate,
                        source: 'RSS'
                    }));
                }
            } catch (e) {}
        }

        // --- RSS AUTO-DISCOVERY & WORDPRESS /feed/ ---
        try {
            const feedUrl = urlObj.origin + '/feed/';
            const feed = await parser.parseURL(feedUrl);
            if (feed.items && feed.items.length > 0) {
                return feed.items.slice(0, 3).map(item => ({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    source: 'RSS'
                }));
            }
        } catch (e) {}

        // --- GENERIC HTML PARSING ---
        const { data } = await axios.get(websiteUrl, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);

        // Check RSS tags in HTML
        let rssUrl = $('link[type="application/rss+xml"]').attr('href') || $('link[type="application/atom+xml"]').attr('href');
        if (rssUrl) {
            if (!rssUrl.startsWith('http')) {
                rssUrl = urlObj.origin + (rssUrl.startsWith('/') ? '' : '/') + rssUrl;
            }
            try {
                const feed = await parser.parseURL(rssUrl);
                if (feed.items && feed.items.length > 0) {
                    return feed.items.slice(0, 3).map(item => ({
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate,
                        source: 'RSS'
                    }));
                }
            } catch(e) {}
        }

        // HTML heuristics
        const news = [];
        $('.elementor-post__title a, .post-title a, .entry-title a, h2 a, h3 a, article a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim().replace(/\s+/g, ' ');
            if (href && text.length > 10 && !text.toLowerCase().includes('lire la suite') && !text.toLowerCase().includes('en savoir') && !news.find(n => n.link === href)) {
                let fullHref = href;
                if (!fullHref.startsWith('http')) {
                    fullHref = urlObj.origin + (fullHref.startsWith('/') ? '' : '/') + fullHref;
                }
                news.push({
                    title: text,
                    link: fullHref,
                    source: 'HTML'
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
    runScraper,
    scrapeNewsFromWebsite,
    KNOWN_URLS
};

// If run directly
if (require.main === module) {
    runScraper();
}
