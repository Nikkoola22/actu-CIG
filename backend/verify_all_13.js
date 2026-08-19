const { scrapeNewsFromWebsite, KNOWN_URLS } = require('./scraper.js');

const targetList = ['01', '18', '27', '74', '58', '60', '61', '62', '63', '37', '46', '66', '81'];

async function verify() {
    console.log("=== VERIFYING SCRAPING FOR THE 13 REQUESTED CDGS ===\n");
    for (const code of targetList) {
        const url = KNOWN_URLS[code];
        console.log(`[CDG ${code}] Scraping from: ${url}`);
        try {
            const results = await scrapeNewsFromWebsite(url);
            console.log(`  -> Items found: ${results.length}`);
            results.forEach((item, idx) => {
                console.log(`     ${idx + 1}. [${item.source}] ${item.title}`);
                console.log(`        Link: ${item.link}`);
            });
        } catch(e) {
            console.log(`  -> ERROR: ${e.message}`);
        }
        console.log('----------------------------------------------------');
    }
}

verify();
