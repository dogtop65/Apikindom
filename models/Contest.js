const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  matchId: String,
  contests: [
    {
      prize: String,
      entryFee: String,
      totalSpots: Number,
      spotsLeft: Number,
      isGuaranteed: Boolean,
      isBonusAllowed: Boolean
    }
  ]
});

module.exports = mongoose.model('Contest', contestSchema);
