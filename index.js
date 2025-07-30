const express = require('express');
const app = express();

// Render ke liye dynamic port use karo:
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from Termux Express backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
