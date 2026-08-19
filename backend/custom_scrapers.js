const axios = require('axios');
const cheerio = require('cheerio');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function scrapeCDG(num, url, rssUrl) {
    console.log(`\nScraping ${num}...`);
    try {
        const { data } = await axios.get(rssUrl, { timeout: 8000 });
        console.log(`${num} RSS length:`, data.length);
        console.log(`${num} RSS preview:`, data.substring(0, 200).replace(/\n/g, ' '));
    } catch (e) {
        console.error(`${num} RSS error:`, e.message);
        try {
            const { data } = await axios.get(url, { timeout: 8000 });
            const $ = cheerio.load(data);
            const articles = [];
            $('h1 a, h2 a, h3 a, h4 a, .actu a').each((i, el) => {
                 articles.push({ title: $(el).text().trim(), href: $(el).attr('href') });
            });
            console.log(`${num} articles:`, articles.filter(a => a.title.length > 5).slice(0, 3));
        } catch (e2) {
             console.error(`${num} HTML error:`, e2.message);
        }
    }
}

async function main() {
    await scrapeCDG('28', 'https://www.cdg28.fr/actualites/', 'https://www.cdg28.fr/feed/');
    await scrapeCDG('68', 'https://www.cdg68.fr/categories/actualites/', 'https://www.cdg68.fr/feed/');
    await scrapeCDG('23', 'https://www.cdg23.fr/', 'https://www.cdg23.fr/feed/');
    await scrapeCDG('19', 'https://www.cdg19.fr/', 'https://www.cdg19.fr/rss.php');
}

main();
