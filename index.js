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

// ✅ Home route
app.get('/', (req, res) => {
res.send('✅ Welcome to Termux + Express + Render Cricket API Backend!');
});

// ✅ Combined Live + Upcoming Matches (filtered)
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

  const combined = [liveResponse.data, upcomingResponse.data];  
  const filteredTypeMatches = [];  

  combined.forEach(data => {  
    if (!data?.typeMatches) return;  

    data.typeMatches.forEach(type => {  
      const seriesMatches = [];  

      type.seriesMatches.forEach(series => {  
        const wrapper = series.seriesAdWrapper;  
        if (!wrapper || !Array.isArray(wrapper.matches)) return;  

        // ❌ Skip completed matches  
        const validMatches = wrapper.matches.filter(  
          match => match.matchInfo?.state !== 'Complete'  
        );  

        if (validMatches.length > 0) {  
          seriesMatches.push({  
            seriesAdWrapper: {  
              ...wrapper,  
              matches: validMatches  
            }  
          });  
        }  
      });  

      if (seriesMatches.length > 0) {  
        filteredTypeMatches.push({  
          matchType: type.matchType,  
          seriesMatches  
        });  
      }  
    });  
  });  

  return res.json({ typeMatches: filteredTypeMatches });  

} catch (err) {  
  lastError = err;  
  console.warn(`⚠️ Key ${i + 1} failed: ${err.response?.status || err.message}`);  
}

}

console.error('❌ All API keys failed');
res.status(500).json({ error: 'All API keys failed. Try again later.' });
});

// ✅ Start server
app.listen(PORT, () => {
console.log(🚀 Server running on port ${PORT});
});

Pura updated code do

