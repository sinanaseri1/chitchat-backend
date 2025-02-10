const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./schemas/User");
const { Validate} = require("./controller")
const authenticateUser = require("./middleware")

// Function to create JWT token
const createToken = (userId) => {
  const payload = { userId };
  const secretKey = process.env.KEY;
  const options = { expiresIn: "1h" };
  return jwt.sign(payload, secretKey, options);
};

// Login route
router.post("/login", async (req, res) => {
  console.log("the right function")
  const { username, password } = req.body;

  // Step 1: Find user by username
  const user = await User.findOne({ username });

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
  // res.cookie("token", token, {
  //   secure: process.env.NODE_ENV === "production", // Only true in production (use HTTPS in prod)
  //   httpOnly: true, // Prevent client-side access to the cookie
  //   maxAge: 3600000, // 1 hour
  //   sameSite: "strict", // Strict mode for cookies (enhances security)
  // });

  res.cookie("token", token, {
    secure: false, // Use `true` only in production with HTTPS
    httpOnly: true, // Prevent client-side access
    maxAge: 3600000, // 1 hour
    sameSite: "lax", // Prevent CSRF
});


  // Step 5: Send the response with a message
  res.status(200).send({ message: "Login successful", token });
});

router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = new User({ username, password: hashedPassword });

  try {
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating user" });
  }
});

router.get("/validate", authenticateUser, Validate)

module.exports = router;