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
try {
const matches = await fetchMatches();
res.json({ matches });
} catch (err) {
res.status(500).json({ error: 'Failed to fetch matches' });
}
});

async function fetchMatches() {
const endpoints = [
'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live',
'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming'
];

const now = Date.now();
for (let i = 0; i < apiKeys.length; i++) {
try {
const key = apiKeys[i];
const [live, upcoming] = await Promise.all(
endpoints.map(url => axios.get(url, {
headers: {
'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
'x-rapidapi-key': key
}
}))
);

const combined = [live.data, upcoming.data];    
  const allMatches = [];    

  combined.forEach(data => {    
    data.typeMatches?.forEach(type => {    
      type.seriesMatches?.forEach(series => {    
        const matches = series.seriesAdWrapper?.matches || [];    
        matches.forEach(match => {    
          const matchInfo = match.matchInfo;    
          if (matchInfo?.state !== 'Complete' && parseInt(matchInfo.startDate) > now) {    
            allMatches.push({    
              matchId: matchInfo.matchId,    
              team1: matchInfo.team1?.teamName,    
              team2: matchInfo.team2?.teamName,    
              startDate: matchInfo.startDate    
            });    
          }    
        });    
      });    
    });    
  });    

  return allMatches.sort((a, b) => parseInt(a.startDate) - parseInt(b.startDate));    

} catch (err) {    
  console.warn(`⚠️ API key ${i + 1} failed: ${err.message}`);    
}

}

throw new Error('❌ All API keys failed');
}

// ✅ Get contests for a match
app.get('/contests/:matchId', async (req, res) => {
const matchId = req.params.matchId;

try {
const found = await ContestModel.findOne({ matchId });
if (!found) {
return res.status(404).json({ error: No contests found for matchId: ${matchId} });
}
res.json({ contests: found.contests });
} catch (err) {
res.status(500).json({ error: 'Error loading contests' });
}
});

// ✅ Manually post contests
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

res.json({ message: 'Contests saved successfully', data: updated });

} catch (err) {
res.status(500).json({ error: 'Error saving contest' });
}
});

// ✅ Auto-generate contests for all valid matches
app.post('/generate-default-contests', async (req, res) => {
try {
const matches = await fetchMatches();

const defaultContests = [    
  { prize: "50000", entryFee: "49", totalSpots: 1000, spotsLeft: 1000, isGuaranteed: true, isBonusAllowed: true },    
  { prize: "10000", entryFee: "29", totalSpots: 500, spotsLeft: 500, isGuaranteed: true, isBonusAllowed: false },    
  { prize: "2500",  entryFee: "9",  totalSpots: 200, spotsLeft: 200, isGuaranteed: false, isBonusAllowed: true }    
];    

let added = 0;    
for (const match of matches) {    
  const exists = await ContestModel.findOne({ matchId: match.matchId });    
  if (!exists) {    
    await ContestModel.create({    
      matchId: match.matchId,    
      contests: defaultContests    
    });    
    console.log(`✅ Contests added for matchId: ${match.matchId}`);    
    added++;    
  }    
}    

res.json({ message: `Contests generated for ${added} new matches.` });

} catch (err) {
console.error('❌ Error in generating contests:', err.message);
res.status(500).json({ error: 'Failed to generate contests' });
}
});

// ✅ Start server
app.listen(PORT, () => {
console.log(🚀 Server running on port ${PORT});
});
