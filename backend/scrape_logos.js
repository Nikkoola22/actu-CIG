const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = axios.create({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
    }
});

const BLACKLIST_IMG_KEYWORDS = [
    'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok',
    'warning', 'ie8', 'arrow', 'chevron', 'search', 'loupe', 'menu', 'burger',
    'loader', 'spinner', 'pixel', 'blank.gif', 'spacer', 'banner_cookies', 'tarteaucitron'
];

function isLogoValid(src, alt = '', cls = '') {
    if (!src || typeof src !== 'string') return false;
    const cleanSrc = src.toLowerCase();
    const cleanAlt = alt.toLowerCase();
    const cleanCls = cls.toLowerCase();

    for (const bad of BLACKLIST_IMG_KEYWORDS) {
        if (cleanSrc.includes(bad) || cleanAlt.includes(bad)) return false;
    }

    if (cleanSrc.endsWith('.ico') || cleanSrc.includes('favicon')) return false;
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

async function extractLogoForCDG(cdgObj) {
    const { cdg, officialUrl } = cdgObj;
    if (!officialUrl) {
        return null;
    }

    let domain = '';
    try {
        domain = new URL(officialUrl).hostname;
    } catch {
        return null;
    }

    const fallbackGoogleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    try {
        const res = await client.get(officialUrl);
        const $ = cheerio.load(res.data);

        const candidates = [];

        // 1. High priority: Header / Navbar / Logo class specific images
        $('header a.logo img, header .logo img, header .custom-logo, .site-logo img, .navbar-brand img, #logo img, a[class*="logo"] img, img.custom-logo, .brand img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
            const alt = $(el).attr('alt') || '';
            const cls = $(el).attr('class') || '';
            if (isLogoValid(src, alt, cls)) {
                candidates.push({ score: 100, src: resolveUrl(officialUrl, src) });
            }
        });

        // 2. Medium priority: Any image with "logo" in src or alt or class inside header/nav
        $('header img, nav img, .header img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
            const alt = $(el).attr('alt') || '';
            const cls = $(el).attr('class') || '';
            if (isLogoValid(src, alt, cls)) {
                const isExplicitLogo = src.toLowerCase().includes('logo') || alt.toLowerCase().includes('logo') || cls.toLowerCase().includes('logo');
                candidates.push({ score: isExplicitLogo ? 90 : 50, src: resolveUrl(officialUrl, src) });
            }
        });

        // 3. Any image in the entire document explicitly called "logo"
        $('img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
            const alt = $(el).attr('alt') || '';
            const cls = $(el).attr('class') || '';
            if (isLogoValid(src, alt, cls)) {
                if (src.toLowerCase().includes('logo') || alt.toLowerCase().includes('logo')) {
                    candidates.push({ score: 80, src: resolveUrl(officialUrl, src) });
                }
            }
        });

        // 4. OpenGraph image (if it's not a general landscape hero)
        const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content');
        if (ogImage && isLogoValid(ogImage) && (ogImage.toLowerCase().includes('logo') || ogImage.toLowerCase().includes('cropped'))) {
            candidates.push({ score: 70, src: resolveUrl(officialUrl, ogImage) });
        }

        // 5. Apple touch icon (high resolution site badge)
        const appleIcon = $('link[rel="apple-touch-icon"]').attr('href') || $('link[rel="apple-touch-icon-precomposed"]').attr('href');
        if (appleIcon) {
            candidates.push({ score: 60, src: resolveUrl(officialUrl, appleIcon) });
        }

        if (candidates.length > 0) {
            // Sort by highest score
            candidates.sort((a, b) => b.score - a.score);
            const best = candidates[0].src;
            return best;
        }

        // Fallback to Google high-res favicon if no HTML image found
        return fallbackGoogleFavicon;
    } catch (e) {
        // console.log(`  Logo extraction failed for ${cdg}: ${e.message}`);
        return fallbackGoogleFavicon;
    }
}

async function scrapeAllLogos() {
    console.log('🚀 Démarrage de la récupération des logos des CDG/CIG...');

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
        console.error('❌ Impossible de trouver data.json');
        return;
    }

    console.log(`Chargement de ${allData.length} CDGs depuis : ${dataPath}`);

    let logoCount = 0;

    for (let i = 0; i < allData.length; i++) {
        const cdg = allData[i];
        process.stdout.write(`[${i + 1}/${allData.length}] Recherche logo pour ${cdg.cdg}... `);

        const logoUrl = await extractLogoForCDG(cdg);
        if (logoUrl) {
            cdg.logo = logoUrl;
            logoCount++;
            console.log(`✅ ${logoUrl.substring(0, 80)}...`);
        } else {
            console.log(`⚠️ Aucun logo trouvé`);
        }

        // Slight pause to be polite
        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n======================================================`);
    console.log(`📊 BILAN RÉCUPÉRATION DES LOGOS :`);
    console.log(`Total CDGs : ${allData.length}`);
    console.log(`Logos récupérés : ${logoCount} / ${allData.length}`);
    console.log(`======================================================\n`);

    const saveTargets = [
        path.join(__dirname, '..', 'data.json'),
        path.join(__dirname, 'data.json'),
        path.join(__dirname, '..', 'frontend', 'public', 'data.json'),
        path.join(__dirname, '..', 'api', 'data.json'),
        'U:\\perso\\actu-CIG\\data.json',
        'U:\\perso\\actu-CIG\\backend\\data.json',
        'U:\\perso\\actu-CIG\\frontend\\public\\data.json',
        'U:\\perso\\actu-CIG\\api\\data.json'
    ];

    const jsonStr = JSON.stringify(allData, null, 2);
    for (const target of saveTargets) {
        try {
            const dir = path.dirname(target);
            if (fs.existsSync(dir)) {
                fs.writeFileSync(target, jsonStr, 'utf8');
                console.log(`💾 Données et logos enregistrés dans : ${target}`);
            }
        } catch (err) {
            // ignore
        }
    }

    console.log('\n🎉 Synchronisation des logos terminée avec succès !');
}

if (require.main === module) {
    scrapeAllLogos().catch(err => {
        console.error('Erreur fatale :', err);
    });
}

module.exports = {
    extractLogoForCDG,
    scrapeAllLogos
};
