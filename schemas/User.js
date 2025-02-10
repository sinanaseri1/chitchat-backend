const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Make sure usernames are unique
  },
  email: {
    type: String,
    required: true,
    unique: true, // Make sure emails are unique
    match: [/.+@.+\..+/, 'Please fill a valid email address'], // Simple regex to validate email format
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("User", userSchema);
