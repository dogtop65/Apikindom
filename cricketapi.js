const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.get('/matches', async (req, res) => {
  try {
    const response = await axios.get('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/recent', {
      headers: {
        'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
        'x-rapidapi-key': '48851c0f11msh8e91915851f35d4p17ca9cjsn7d03483aea2a'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Cricbuzz API' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
