const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { runScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let isScraping = false;

// Endpoint to get the data (supports both /api/news and /news)
const handleNews = (req, res) => {
    try {
        const candidatePaths = [
            path.join(__dirname, 'data.json'),
            path.join(process.cwd(), 'backend', 'data.json'),
            path.join(process.cwd(), 'data.json'),
            path.join(process.cwd(), 'api', 'data.json'),
            path.join(process.cwd(), 'frontend', 'public', 'data.json'),
            path.join(__dirname, '..', 'backend', 'data.json'),
            path.join(__dirname, '..', 'data.json')
        ];

        let raw = null;
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                raw = fs.readFileSync(p, 'utf8');
                break;
            }
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

        if (raw) {
            res.json(JSON.parse(raw));
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error in /api/news:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
};

app.get('/api/news', handleNews);
app.get('/news', handleNews);

const handleMetadata = (req, res) => {
    try {
        const candidatePaths = [
            path.join(__dirname, 'metadata.json'),
            path.join(process.cwd(), 'backend', 'metadata.json'),
            path.join(process.cwd(), 'metadata.json'),
            path.join(process.cwd(), 'api', 'metadata.json'),
            path.join(process.cwd(), 'frontend', 'public', 'metadata.json'),
            path.join(__dirname, '..', 'backend', 'metadata.json'),
            path.join(__dirname, '..', 'metadata.json')
        ];

        let raw = null;
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                raw = fs.readFileSync(p, 'utf8');
                break;
            }
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

        if (raw) {
            res.json(JSON.parse(raw));
        } else {
            res.json({ lastUpdated: new Date().toISOString() });
        }
    } catch (error) {
        res.json({ lastUpdated: new Date().toISOString() });
    }
};

app.get('/api/metadata', handleMetadata);
app.get('/api/metadata.json', handleMetadata);
app.get('/metadata.json', handleMetadata);

app.get('/api/status', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ isScraping });
});

// Endpoint to trigger a new scrape
app.post('/api/scrape', async (req, res) => {
    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (isScraping) {
            return res.json({ message: 'Scraping already in progress', isScraping: true });
        }
        isScraping = true;
        
        runScraper()
            .then(() => {
                isScraping = false;
            })
            .catch(err => {
                console.error('Scraping error:', err);
                isScraping = false;
            });

        res.json({ message: 'Scraping lancé avec succès', isScraping: true, timestamp: new Date().toISOString() });
    } catch (error) {
        isScraping = false;
        res.status(500).json({ error: 'Failed to start scraping' });
    }
});

if (require.main === module || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
