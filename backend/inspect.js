const axios = require('axios');
const cheerio = require('cheerio');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
    try {
        let {data} = await axios.get('https://cdg01.fr/page-1091');
        let $ = cheerio.load(data);
        console.log('01:', $('.elementor-post__title a, .pt-cv-title a, .views-row a').map((i,el)=>$(el).text().trim()).get());
        if ($('.elementor-post__title a').length === 0) {
            console.log('01 alternative:', $('a').map((i,el)=>$(el).text().trim()).get().filter(t => t.length > 20).slice(0,5));
        }

        data = (await axios.get('https://www.cdg31.fr/actualites')).data;
        $ = cheerio.load(data);
        console.log('31:', $('.views-field-title a, .node-title a, article a').map((i,el)=>$(el).text().trim()).get().filter(t => t.length > 10).slice(0,5));
        if ($('.views-field-title a').length === 0) {
            console.log('31 alternative:', $('a').map((i,el)=>$(el).text().trim()).get().filter(t => t.length > 20).slice(0,5));
        }
    } catch(e) {
        console.log(e.message);
    }
}
run();
