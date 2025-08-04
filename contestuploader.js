// contestuploader.js
const mongoose = require('mongoose');
const Contest = require('./models/Contest');
const contestData = require('./Contest.json'); // agar JSON file hai toh

// MongoDB URI
const mongoUri = 'mongodb+srv://<user>:<pass>@...';

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ MongoDB connected');

    for (const matchId in contestData) {
      const contests = contestData[matchId];

      await Contest.findOneAndUpdate(
        { matchId },
        { matchId, contests },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Contest data uploaded to MongoDB');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });
