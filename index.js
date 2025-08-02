const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

// ✅ Load keys from keys.json
let apiKeys = [];
try {
  apiKeys = JSON.parse(fs.readFileSync('./keys.json', 'utf8'));
} catch (err) {
  console.error('❌ Failed to load API keys:', err.message);
  process.exit(1);
}

// ✅ Home route
app.get('/', (req, res) => {
  res.send('✅ Welcome to Termux + Express + Render Cricket API Backend!');
});

// ✅ Match route with smart API key rotation
app.get('/matches', async (req, res) => {
  const url = 'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming';
  let lastError = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    try {
      const response = await axios.get(url, {
        headers: {
          'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
          'x-rapidapi-key': key
        }
      });
      console.log(`✅ Success using key ${i + 1}`);
      return res.json(response.data);
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Key ${i + 1} failed: ${err.response?.status || err.message}`);
    }
  }

  // ❌ All keys failed
  console.error('❌ All API keys exhausted or failed');
  res.status(500).json({ error: 'All API keys failed. Try again later.' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
