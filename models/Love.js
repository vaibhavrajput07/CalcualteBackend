const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema and model
const loveSchema = new mongoose.Schema({
  yourName: { type: String, required: true },
  partnerName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});


const Love = mongoose.model("Love", loveSchema);

module.exports = Love;