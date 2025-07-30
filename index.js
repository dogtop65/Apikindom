const express = require('express');
const axios = require('axios');
const app = express();

// Render ke liye dynamic port
const PORT = process.env.PORT || 3000;

// Home Route
app.get('/', (req, res) => {
  res.send('Welcome to Termux + Express + Render Cricket API Backend!');
});

// Cricket Matches Route (from RapidAPI)
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
    res.status(500).json({ error: 'Failed to fetch data from RapidAPI' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
