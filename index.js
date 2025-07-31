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
        'x-rapidapi-key': 'db37666c95mshafc4270226b9c42p1db5f7jsn236c02743460'
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
