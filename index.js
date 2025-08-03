const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

// ✅ Load API keys
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

      // ✅ Sort by nearest start time
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

// ✅ Contest API — get contests for a match by key (like india_vs_australia)
app.get('/contests/:matchKey', (req, res) => {
  try {
    const matchKey = req.params.matchKey.toUpperCase().replace(/\s+/g, '_');
    const contestData = JSON.parse(fs.readFileSync('./Contest.json', 'utf8'));

    if (contestData[matchKey]) {
      res.json({ contests: contestData[matchKey] });
    } else {
      res.status(404).json({ error: `No contests found for matchKey: ${matchKey}` });
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
