const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const candidatePaths = [
            path.join(process.cwd(), 'backend', 'data.json'),
            path.join(process.cwd(), 'api', 'data.json'),
            path.join(process.cwd(), 'frontend', 'public', 'data.json'),
            path.join(__dirname, 'data.json')
        ];

        let data = null;
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                data = fs.readFileSync(p, 'utf8');
                break;
            }
        }

        if (data) {
            res.status(200).json(JSON.parse(data));
        } else {
            res.status(200).json([]);
        }
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to retrieve news data' });
    }
};
