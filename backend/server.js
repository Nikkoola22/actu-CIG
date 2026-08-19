const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { runScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint to get the data (supports both /api/news and /news)
const handleNews = (req, res) => {
    try {
        if (fs.existsSync('data.json')) {
            const data = fs.readFileSync('data.json', 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to read data' });
    }
};

app.get('/api/news', handleNews);
app.get('/news', handleNews);

// Endpoint to trigger a new scrape
app.post('/api/scrape', async (req, res) => {
    try {
        // Run asynchronously, don't wait for completion to respond
        runScraper().catch(err => console.error('Scraping error:', err));
        res.json({ message: 'Scraping started in background' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start scraping' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
