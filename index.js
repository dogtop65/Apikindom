const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// ✅ Load API keys
let apiKeys = [];
try {
  const keysPath = path.resolve(__dirname, 'keys.json');
  apiKeys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
} catch (err) {
  console.error('❌ Failed to load API keys:', err.message);
  process.exit(1);
}

// ✅ Home route
app.get('/', (req, res) => {
  res.send('✅ Welcome to Express + Render Fantasy Sports Backend!');
});

// ✅ Matches API — future matches only
app.get('/matches', async (req, res) => {
  const endpoints = [
    'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live',
    'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming'
  ];

  const now = Date.now();
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

      const combined = [liveResponse.data, upcomingResponse.data];
      const allMatches = [];

      combined.forEach(data => {
        if (!data?.typeMatches) return;

        data.typeMatches.forEach(type => {
          type.seriesMatches.forEach(series => {
            const wrapper = series.seriesAdWrapper;
            if (!wrapper || !Array.isArray(wrapper.matches)) return;

            const validMatches = wrapper.matches.filter(match => {
              const matchInfo = match.matchInfo;
              if (!matchInfo || matchInfo.state === 'Complete') return false;

              const startTime = parseInt(matchInfo.startDate);
              return startTime > now;
            });

            allMatches.push(...validMatches);
          });
        });
      });

      allMatches.sort((a, b) => {
        return parseInt(a.matchInfo.startDate) - parseInt(b.matchInfo.startDate);
      });

      return res.json({ matches: allMatches });

    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Key ${i + 1} failed: ${err.response?.status || err.message}`);
    }
  }

  console.error('❌ All API keys failed');
  res.status(500).json({ error: 'All API keys failed. Try again later.' });
});

// ✅ Contest API — fetch contests using matchId
app.get('/contests/:matchId', (req, res) => {
  try {
    const matchId = req.params.matchId; // e.g. 74858 or "14593"

    const contestFilePath = path.resolve(__dirname, 'Contest.json');
    const contestData = JSON.parse(fs.readFileSync(contestFilePath, 'utf8'));

    console.log('📥 matchId requested:', matchId);
    if (contestData[matchId]) {
      return res.json({ contests: contestData[matchId] });
    } else {
      return res.status(404).json({ error: `No contests found for matchId: ${matchId}` });
    }
  } catch (err) {
    console.error('❌ Error loading Contest.json:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
