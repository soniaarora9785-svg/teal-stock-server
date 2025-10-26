// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ALPHA_VANTAGE_KEY;

// Endpoint for a stock symbol
app.get('/stock/:symbol', async (req, res) => {
    const symbol = req.params.symbol;

    // Fetch 1-min intraday data from Alpha Vantage
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(symbol)}&interval=1min&outputsize=compact&apikey=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Find the key that contains time series
        const key = Object.keys(data).find(k => k.startsWith('Time Series'));
        if (!key) return res.status(500).json({ error: 'No data found or rate-limited' });

        const series = data[key];

        // Format candles
        const candles = Object.entries(series)
            .map(([time, val]) => ({
                time,
                open: parseFloat(val['1. open']),
                high: parseFloat(val['2. high']),
                low: parseFloat(val['3. low']),
                close: parseFloat(val['4. close']),
                volume: parseInt(val['5. volume'])
            }))
            .sort((a, b) => new Date(a.time) - new Date(b.time)); // Oldest first

        res.json({ symbol, candles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
