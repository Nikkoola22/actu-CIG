const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const candidatePaths = [
            path.join(process.cwd(), 'backend', 'metadata.json'),
            path.join(process.cwd(), 'api', 'metadata.json'),
            path.join(process.cwd(), 'frontend', 'public', 'metadata.json'),
            path.join(process.cwd(), 'metadata.json'),
            path.join(__dirname, 'metadata.json'),
            path.join(__dirname, '..', 'backend', 'metadata.json')
        ];

        let raw = null;
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                raw = fs.readFileSync(p, 'utf8');
                break;
            }
        }

        if (raw) {
            return res.status(200).json(JSON.parse(raw));
        }
    } catch (err) {}

    return res.status(200).json({
        lastUpdated: new Date().toISOString()
    });
};
