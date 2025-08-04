// models/Contest.js
const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true
  },
  contests: [
    {
      id: String,
      name: String,
      prize: String,
      entryFee: String,
      totalSpots: Number,
      spotsLeft: Number,
      isGuaranteed: Boolean,
      isBonusAllowed: Boolean,
      badge: String
    }
  ]
});

module.exports = mongoose.model('Contest', contestSchema);
