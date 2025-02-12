const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./schemas/User");
const { Validate } = require("./controller");
const authenticateUser = require("./middleware");

// Function to create JWT token
const createToken = (userId) => {
  const payload = { userId };
  const secretKey = process.env.KEY;
  const options = { expiresIn: "1h" }; // The token expires in 1 hour (you can adjust this if needed)
  return jwt.sign(payload, secretKey, options);
};

// Login route (can use either username or email)
router.post("/login", async (req, res) => {
  console.log("the right function");
  const { usernameOrEmail, password } = req.body; // Accept either username or email

  // Step 1: Find user by username or email
  const user = await User.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
  });

  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }

  // Step 2: Compare password with stored hash
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).send({ message: "Invalid password" });
  }

  // Step 3: Create a JWT token
  const token = createToken(user._id);

  // Step 4: Set the token in cookies (secure and httpOnly flags)
  res.cookie("token", token, {
    secure: false, // Use `true` only in production with HTTPS
    httpOnly: true, // Prevent client-side access
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (in milliseconds)
    sameSite: "lax", // Prevent CSRF
  });

  // Step 5: Send the response with a message
  res.status(200).send({ message: "Login successful", token });
});

// Signup route
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user already exists by username or email
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = new User({ username, email, password: hashedPassword });

  try {
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating user" });
  }
});

// Validate route (protected)
router.get("/validate", authenticateUser, async (req, res) => {
  try {
    // The `authenticateUser` middleware has added `req.user` with user info
    const user = await User.findById(req.user.userId); // Access the userId from the decoded token

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Send back the username
    res.status(200).send({ username: user.username });
  } catch (error) {
    console.error("Error validating user:", error);
    res.status(500).send({ message: "Server error" });
  }
});

// Search users route (protected) - now searching by username
router.get("/users/search", authenticateUser, async (req, res) => {
  try {
    // The frontend will hit /users/search?username=someValue
    const { username } = req.query;

    // If no username query is given, we can either return an empty list or all users.
    // For now, let's return all users if no 'username' query is present:
    if (!username) {
      const allUsers = await User.find({});
      return res.status(200).json({ users: allUsers });
    }

    // Case-insensitive 'contains' search using a RegExp on the username field
    const regex = new RegExp(username, "i");
    const matchingUsers = await User.find({ username: regex });

    return res.status(200).json({ users: matchingUsers });
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ message: "Error searching users" });
  }
});

// Delete account route (protected)
router.delete("/delete-account", authenticateUser, async (req, res) => {
  try {
    // The authenticateUser middleware has added req.user with the userId
    const userId = req.user.userId;

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear the authentication cookie
    res.clearCookie("token");

    res.status(200).json({ message: "Sorry to see you go" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Error deleting account" });
  }
});

// router.js
router.get("/users", authenticateUser, async (req, res) => {
  try {
    // Return usernames/emails, etc. Adjust as you like.
    const allUsers = await User.find({}, "username email _id");
    res.status(200).json({ users: allUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

module.exports = router;
