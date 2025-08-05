const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware to parse JSON
app.use(express.json());

// ✅ MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://L3G3ND:4aRwgDKx18yGBp6p@cluster100.lm1xasx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster100';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully!'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// ✅ Mongoose Contest model
const ContestModel = require('./models/Contest');

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

// ✅ Matches API — only upcoming & live
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


// ✅ GET contests from MongoDB
app.get('/contests/:matchId', async (req, res) => {
  const matchId = req.params.matchId;

  try {
    const found = await ContestModel.findOne({ matchId });
    if (!found) {
      return res.status(404).json({ error: `No contests found for matchId: ${matchId}` });
    }

    console.log('📤 Contest GET →', matchId);
    res.json({ contests: found.contests });

  } catch (err) {
    console.error('❌ Error loading contests:', err.message);
    res.status(500).json({ error: 'Internal server error while loading contests' });
  }
});

// ✅ POST contests to MongoDB
app.post('/contests/:matchId', async (req, res) => {
  const matchId = req.params.matchId;
  const contests = req.body.contests;

  if (!Array.isArray(contests) || contests.length === 0) {
    return res.status(400).json({ error: 'Contests must be a non-empty array' });
  }

  try {
    const updated = await ContestModel.findOneAndUpdate(
      { matchId },
      { matchId, contests },
      { upsert: true, new: true }
    );

    console.log(`✅ Contest saved for matchId: ${matchId}`);
    res.json({ message: 'Contests saved successfully', data: updated });

  } catch (err) {
    console.error('❌ Failed to save contest:', err.message);
    res.status(500).json({ error: 'Error saving contest' });
  }
});


// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
