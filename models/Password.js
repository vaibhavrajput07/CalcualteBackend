const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const passwordSchema = new mongoose.Schema({
  password: { type: String, required: true },
});

const Password = mongoose.model('Password', passwordSchema);

module.exports = Password;
