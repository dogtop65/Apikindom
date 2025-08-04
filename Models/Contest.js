const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema({
  matchId: String,
  contests: [
    {
      name: String,
      prize: String,
      entry: String,
      spots: String,
      filled: String,
      mega: Boolean,
      guaranteed: Boolean,
      bonus: String
    }
  ]
});

module.exports = mongoose.model('Contest', ContestSchema);
