const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

// ✅ Load API keys from keys.json
let apiKeys = [];
try {
  apiKeys = JSON.parse(fs.readFileSync('./keys.json', 'utf8'));
} catch (err) {
  console.error('❌ Failed to load API keys:', err.message);
  process.exit(1);
}

// 🧠 Utility to extract & filter valid matches
function extractValidMatches(data) {
  const matches = [];

  if (!data || !data.typeMatches) return matches;

  for (let i = 0; i < data.typeMatches.length; i++) {
    const type = data.typeMatches[i];
    const seriesList = type.seriesMatches;

    for (let j = 0; j < seriesList.length; j++) {
      const series = seriesList[j];
      const wrapper = series.seriesAdWrapper;

      if (wrapper && wrapper.matches && Array.isArray(wrapper.matches)) {
        for (let k = 0; k < wrapper.matches.length; k++) {
          const match = wrapper.matches[k];

          if (
            match.matchInfo &&
            match.matchInfo.startDate &&
            match.matchInfo.state !== 'Complete'
          ) {
            matches.push(match);
          }
        }
      }
    }
  }

  return matches;
}

// ✅ GET /matches (live + upcoming sorted)
app.get('/matches', async (req, res) => {
  const endpoints = [
    'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live',
    'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming'
  ];

  let lastError = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    try {
      const [liveResponse, upcomingResponse] = await Promise.all(
        endpoints.map(url =>
          axios.get(url, {
            headers: {
              'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
              'x-rapidapi-key': key
            }
          })
        )
      );

      console.log(`✅ Success using key ${i + 1}`);

      // 📦 Extract & combine
      const matches = [
        ...extractValidMatches(liveResponse.data),
        ...extractValidMatches(upcomingResponse.data)
      ];

      // 🕒 Sort by startDate ascending
      matches.sort(function (a, b) {
        return parseInt(a.matchInfo.startDate) - parseInt(b.matchInfo.startDate);
      });

      return res.json({ matches });

    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Key ${i + 1} failed: ${err.response?.status || err.message}`);
    }
  }

  console.error('❌ All API keys failed');
  res.status(500).json({ error: 'All API keys failed. Try again later.' });
});

// ✅ Home route
app.get('/', (req, res) => {
  res.send('✅ Welcome to Termux + Express + Render Cricket API Backend!');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
