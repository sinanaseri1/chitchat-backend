
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
  const options = { expiresIn: "1h" };
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
    maxAge: 3600000, // 1 hour
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
router.get("/validate", authenticateUser, Validate);

module.exports = router;
