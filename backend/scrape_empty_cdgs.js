const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    },
    timeout: 10000
});
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = axios.create({
    timeout: 12000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
    }
});

// Targeted configuration for specific CDGs
const SPECIFIC_CDG_CONFIGS = {
    '02': {
        name: '(02) AISNE',
        urls: ['https://www.cdg02.fr/actualites/', 'https://www.cdg02.fr/'],
        feeds: ['https://www.cdg02.fr/feed/', 'https://www.cdg02.fr/rss.xml']
    },
    '06': {
        name: '(06) ALPES MARITIMES',
        urls: ['https://www.cdg06.fr/actualites/', 'https://www.cdg06.fr/'],
        feeds: ['https://www.cdg06.fr/feed/']
    },
    '07': {
        name: '(07) ARDECHE',
        urls: ['https://www.cdg07.com/agentterritorial/cdg,1.html', 'https://www.cdg07.com/grandpublic/cdg,1.html'],
        feeds: []
    },
    '12': {
        name: '(12) AVEYRON',
        urls: ['https://www.cdg12.fr/actualites/', 'https://www.cdg12.fr/'],
        feeds: ['https://www.cdg12.fr/feed/']
    },
    '13': {
        name: '(13) BOUCHES-DU-RHÔNE',
        urls: ['https://www.cdg13.com/actualites/', 'https://www.cdg13.com/'],
        feeds: ['https://www.cdg13.com/feed/']
    },
    '14': {
        name: '(14) CALVADOS',
        urls: ['https://www.cdg14.fr/actualites/', 'https://www.cdg14.fr/'],
        feeds: ['https://www.cdg14.fr/feed/']
    },
    '22': {
        name: '(22) CÔTES D’ARMOR',
        urls: ['https://www.cdg22.fr/actualites', 'https://www.cdg22.fr/'],
        feeds: ['https://www.cdg22.fr/feed/', 'https://www.cdg22.fr/rss.xml']
    },
    '29': {
        name: '(29) FINISTÈRE',
        urls: ['https://www.cdg29.bzh/actualites', 'https://www.cdg29.fr/actualites', 'https://www.cdg29.fr/'],
        feeds: ['https://www.cdg29.bzh/feed/', 'https://www.cdg29.fr/feed/']
    },
    '32': {
        name: 'GERS (32)',
        urls: ['https://www.cdg32.fr/actualites/', 'https://www.cdg32.fr/'],
        feeds: ['https://www.cdg32.fr/feed/']
    },
    '35': {
        name: '(35) ILLE-ET-VILAINE',
        urls: ['https://www.cdg35.fr/actualites/', 'https://www.cdg35.fr/'],
        feeds: ['https://www.cdg35.fr/feed/', 'https://www.cdg35.fr/rss.xml']
    },
    '54': {
        name: '(54) MEURTHE ET MOSELLE',
        urls: ['https://www.cdg54.fr/actualites/', 'https://www.cdg54.fr/'],
        feeds: ['https://www.cdg54.fr/feed/']
    },
    '55': {
        name: '(55) MEUSE',
        urls: ['https://www.cdg55.fr/actualites/', 'https://www.cdg55.fr/'],
        feeds: ['https://www.cdg55.fr/feed/']
    },
    '56': {
        name: '(56) MORBIHAN',
        urls: ['https://www.cdg56.fr/actualites', 'https://www.cdg56.fr/'],
        feeds: ['https://www.cdg56.fr/feed/']
    },
    '62': {
        name: 'PAS DE CALAIS (62)',
        urls: ['https://www.cdg62.fr/actualites/', 'https://www.cdg62.fr/'],
        feeds: ['https://www.cdg62.fr/feed/']
    },
    '65': {
        name: '(65) HAUTES-PYRÉNÉES',
        urls: ['https://www.cdg65.fr/actualites/', 'https://www.cdg65.fr/'],
        feeds: ['https://www.cdg65.fr/feed/']
    },
    '69': {
        name: '(69) RHÔNE',
        urls: ['https://www.cdg69.fr/actualites/', 'https://www.cdg69.fr/'],
        feeds: ['https://www.cdg69.fr/feed/']
    },
    '71': {
        name: '(71) SAÔNE-ET-LOIRE',
        urls: ['https://www.cdg71.fr/actualites/', 'https://www.cdg71.fr/'],
        feeds: ['https://www.cdg71.fr/feed/']
    },
    '79': {
        name: '(79) DEUX-SÈVRES',
        urls: ['https://www.cdg79.fr/actualites', 'https://www.cdg79.fr/'],
        feeds: ['https://www.cdg79.fr/feed/']
    },
    '83': {
        name: 'VAR (83)',
        urls: ['https://www.cdg83.fr/actualites/', 'https://www.cdg83.fr/'],
        feeds: ['https://www.cdg83.fr/feed/']
    },
    '84': {
        name: '(84) VAUCLUSE',
        urls: ['https://www.cdg84.fr/actualites/', 'https://www.cdg84.fr/'],
        feeds: ['https://www.cdg84.fr/feed/']
    },
    '86': {
        name: '(86) VIENNE',
        urls: ['https://www.cdg86.fr/actualites/', 'https://www.cdg86.fr/'],
        feeds: ['https://www.cdg86.fr/feed/']
    },
    '89': {
        name: '(89) YONNE',
        urls: ['https://www.cdg89.fr/actualites/', 'https://www.cdg89.fr/'],
        feeds: ['https://www.cdg89.fr/feed/']
    },
    '78': {
        name: '(78) CIG GRANDE COURONNE (VERSAILLES - 78, 91, 95)',
        urls: ['https://www.cigversailles.fr/actualites', 'https://www.cigversailles.fr/'],
        feeds: []
    },
    '92': {
        name: '(92) CIG PETITE COURONNE (92, 93, 94)',
        urls: ['https://www.cig929394.fr/actualites', 'https://www.cig929394.fr/'],
        feeds: ['https://bip.cig929394.fr/actualites-statutaires-focus-de-bip']
    }
};

const BLACKLIST_WORDS = [
    'mentions légales', 'politique de confidentialité', 'plan du site', 'contact', 'contactez-nous',
    'connexion', 'se connecter', 'accueil', 'espace extranet', 'extranet', 'accès réservé',
    'rgpd', 'accessibilité', 'cookies', 'en savoir plus', 'lire la suite', 'toutes les actualités',
    'voir plus', 'retour', 'page suivante', 'recherche', 'menu', 'facebook', 'twitter', 'linkedin',
    'télécharger', 'téléchargement', 'guide', 'qui sommes-nous', 'nos missions', 'organigramme'
];

function isTitleValid(title) {
    if (!title || typeof title !== 'string') return false;
    const clean = title.trim().toLowerCase();
    if (clean.length < 10 || clean.length > 250) return false;
    for (const bad of BLACKLIST_WORDS) {
        if (clean === bad || (clean.length < 30 && clean.startsWith(bad))) {
            return false;
        }
    }
    return true;
}

function resolveUrl(baseUrl, relativeOrAbsolute) {
    if (!relativeOrAbsolute) return null;
    try {
        const u = new URL(relativeOrAbsolute, baseUrl);
        return u.href;
    } catch {
        return relativeOrAbsolute;
    }
}

// Scrape single CDG with multiple fallbacks
async function scrapeEmptyCDG(cdgObj) {
    const cdgName = cdgObj.cdg || '';
    const match = cdgName.match(/\((\d{2}[A-B]?)\)/) || cdgName.match(/(\d{2}[A-B]?)/);
    const code = match ? match[1] : null;
    const config = (code && SPECIFIC_CDG_CONFIGS[code]) ? SPECIFIC_CDG_CONFIGS[code] : null;

    console.log(`\n======================================================`);
    console.log(`🔍 Scraping: ${cdgName} (Code: ${code || 'N/A'})`);

    const candidateUrls = [];
    const candidateFeeds = [];

    if (config) {
        if (config.feeds) candidateFeeds.push(...config.feeds);
        if (config.urls) candidateUrls.push(...config.urls);
    }
    if (cdgObj.officialUrl) {
        const base = cdgObj.officialUrl.replace(/\/+$/, '');
        candidateFeeds.push(`${base}/feed/`, `${base}/rss.xml`, `${base}/feed.xml`);
        candidateUrls.push(`${base}/actualites/`, `${base}/actualites.php`, `${base}/actus/`, base);
    }

    const uniqueFeeds = [...new Set(candidateFeeds)];
    const uniqueUrls = [...new Set(candidateUrls)];

    // 1. Try RSS Feeds
    for (const feedUrl of uniqueFeeds) {
        try {
            const feed = await parser.parseURL(feedUrl);
            if (feed.items && feed.items.length > 0) {
                const validItems = feed.items
                    .filter(item => item.title && item.title.trim().length > 8)
                    .slice(0, 5)
                    .map(item => ({
                        title: item.title.trim().replace(/\s+/g, ' '),
                        link: item.link || feedUrl,
                        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
                        source: 'RSS'
                    }));

                if (validItems.length > 0) {
                    console.log(`  ✅ [RSS SUCCESS] Found ${validItems.length} news items at ${feedUrl}`);
                    return validItems;
                }
            }
        } catch (e) {
            // Ignore feed error and proceed
        }
    }

    // 2. Try HTML scraping with Cheerio
    for (const pageUrl of uniqueUrls) {
        try {
            const res = await client.get(pageUrl);
            const $ = cheerio.load(res.data);
            const articles = [];

            // Selectors targeting common CMS patterns (WordPress, Drupal, Joomla, TYPO3, Custom)
            const selectors = [
                'article',
                '.elementor-post',
                '.post',
                '.actualite-item',
                '.actu-item',
                '.item-actu',
                '.card-news',
                '.news-card',
                '.actu-card',
                '.view-content .views-row',
                '.une-actu',
                '.bloc-actu'
            ];

            // Strategy A: Container based extraction
            for (const sel of selectors) {
                if ($(sel).length > 0) {
                    $(sel).each((i, el) => {
                        const linkEl = $(el).find('h2 a, h3 a, h4 a, .title a, a.card-title, a').first();
                        let title = linkEl.text().trim().replace(/\s+/g, ' ');
                        if (!title) {
                            title = $(el).find('h2, h3, h4, .title').first().text().trim().replace(/\s+/g, ' ');
                        }
                        const href = linkEl.attr('href') || $(el).find('a').first().attr('href');
                        const dateText = $(el).find('time, .date, .post-date, .published').first().text().trim();

                        if (isTitleValid(title) && href && !articles.find(a => a.link === resolveUrl(pageUrl, href))) {
                            articles.push({
                                title,
                                link: resolveUrl(pageUrl, href),
                                pubDate: dateText || undefined,
                                source: 'HTML'
                            });
                        }
                    });
                }
                if (articles.length >= 3) break;
            }

            // Strategy B: Heading links
            if (articles.length === 0) {
                $('h2 a, h3 a, h4 a, .entry-title a, .post-title a').each((i, el) => {
                    const title = $(el).text().trim().replace(/\s+/g, ' ');
                    const href = $(el).attr('href');
                    if (isTitleValid(title) && href && !articles.find(a => a.link === resolveUrl(pageUrl, href))) {
                        articles.push({
                            title,
                            link: resolveUrl(pageUrl, href),
                            source: 'HTML'
                        });
                    }
                });
            }

            // Strategy C: Specific links with keywords in href
            if (articles.length === 0) {
                $('a[href*="actualite"], a[href*="actu"], a[href*="article"], a[href*="detail"]').each((i, el) => {
                    const title = $(el).text().trim().replace(/\s+/g, ' ');
                    const href = $(el).attr('href');
                    if (isTitleValid(title) && href && !articles.find(a => a.link === resolveUrl(pageUrl, href))) {
                        articles.push({
                            title,
                            link: resolveUrl(pageUrl, href),
                            source: 'HTML'
                        });
                    }
                });
            }

            if (articles.length > 0) {
                const uniqueArticles = articles.slice(0, 5);
                console.log(`  ✅ [HTML SUCCESS] Found ${uniqueArticles.length} news items at ${pageUrl}`);
                return uniqueArticles;
            }
        } catch (e) {
            // console.log(`  HTML error for ${pageUrl}: ${e.message}`);
        }
    }

    // 3. Fallback if nothing found
    console.log(`  ⚠️ [FALLBACK] No news articles extracted, keeping fallback official link.`);
    return [{
        title: 'Voir les actualités sur le site officiel',
        link: cdgObj.officialUrl || 'https://fncdg.com/annuaire_cdg/',
        source: 'Fallback'
    }];
}

async function runScraperForEmptyCDGs(options = {}) {
    console.log('🚀 Starting targeted scrape for empty CDGs...');

    // Locate data.json
    const candidateDataPaths = [
        path.join(__dirname, '..', 'data.json'),
        path.join(__dirname, 'data.json'),
        path.join(process.cwd(), 'data.json'),
        'U:\\perso\\actu-CIG\\data.json'
    ];

    let dataPath = null;
    let allData = [];

    for (const p of candidateDataPaths) {
        if (fs.existsSync(p)) {
            dataPath = p;
            allData = JSON.parse(fs.readFileSync(p, 'utf8'));
            break;
        }
    }

    if (!dataPath || allData.length === 0) {
        console.error('❌ Could not locate data.json');
        return;
    }

    console.log(`Loaded ${allData.length} CDGs from: ${dataPath}`);

    // Filter CDGs that have 0 news or only Fallback
    const emptyCDGs = allData.filter(d => 
        !d.news || d.news.length === 0 || (d.news.length === 1 && d.news[0].source === 'Fallback')
    );

    console.log(`Found ${emptyCDGs.length} CDGs without actual news.`);

    let successCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < emptyCDGs.length; i++) {
        const cdg = emptyCDGs[i];
        const news = await scrapeEmptyCDG(cdg);

        if (news && news.length > 0 && news[0].source !== 'Fallback') {
            successCount++;
            cdg.news = news;
            // Update in main dataset
            const mainIdx = allData.findIndex(d => d.cdg === cdg.cdg);
            if (mainIdx !== -1) {
                allData[mainIdx].news = news;
                updatedCount++;
            }
        }

        // Slight pause to avoid overloading servers
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\n======================================================');
    console.log(`📊 SUMMARY OF RESULTS:`);
    console.log(`Total empty CDGs processed: ${emptyCDGs.length}`);
    console.log(`Successfully extracted news: ${successCount} CDGs`);
    console.log(`Still on fallback: ${emptyCDGs.length - successCount} CDGs`);
    console.log('======================================================\n');

    // Save to all relevant paths if requested or by default
    const saveTargets = [
        path.join(__dirname, '..', 'data.json'),
        path.join(__dirname, 'data.json'),
        path.join(__dirname, '..', 'frontend', 'public', 'data.json'),
        path.join(__dirname, '..', 'api', 'data.json')
    ];

    const jsonStr = JSON.stringify(allData, null, 2);
    const metadataStr = JSON.stringify({
        lastUpdated: new Date().toISOString(),
        totalCdgs: allData.length
    }, null, 2);

    for (const target of saveTargets) {
        try {
            const dir = path.dirname(target);
            if (fs.existsSync(dir)) {
                fs.writeFileSync(target, jsonStr, 'utf8');
                const metaPath = path.join(dir, 'metadata.json');
                fs.writeFileSync(metaPath, metadataStr, 'utf8');
                console.log(`💾 Saved updated data & metadata to: ${target}`);
            }
        } catch (err) {
            // ignore inaccessible paths
        }
    }

    console.log('\n🎉 Scraping and data synchronization completed successfully!');
}

// Run if called directly
if (require.main === module) {
    runScraperForEmptyCDGs().catch(err => {
        console.error('Fatal error during scraping execution:', err);
    });
}

module.exports = {
    runScraperForEmptyCDGs,
    scrapeEmptyCDG
};
