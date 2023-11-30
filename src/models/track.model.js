const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  bpm: {
    type: mongoose.Decimal128,
  },
});

const TrackSchema = mongoose.model("Track", trackSchema);

module.exports = TrackSchema;
