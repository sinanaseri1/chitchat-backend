const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Make sure usernames are unique
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("User", userSchema);
