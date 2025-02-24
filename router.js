const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./schemas/User");
const { Validate } = require("./controller");
const authenticateUser = require("./middleware");
const Message = require("./schemas/Message")

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
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production", // Secure in production
    sameSite: 'none', // Required for cross-origin cookies
    maxAge: 24 * 60 * 60 * 1000 * 7, // 7 
    dayspath: '/', 
    sameSite: "lax", // Prevent CSRF
    });

  // res.cookie("token", token, {
  //   secure: false, // Use `true` only in production with HTTPS
  //   httpOnly: true, // Prevent client-side access
  //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (in milliseconds)
  //   sameSite: "lax", // Prevent CSRF
  // });

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
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Return username AND _id
    res.status(200).send({ username: user.username, _id: user._id });
  } catch (error) {
    console.error("Error validating user:", error);
    res.status(500).send({ message: "Server error" });
  }
});


// Search users route (protected) - now searching by username

router.get("/users", authenticateUser, async (req, res) => {
  console.log("Fetching users with messages for:", req.user.userId);

  try {
    const userId = req.user.userId;

    // Fetch messages where the user is either the sender or receiver
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate("sender", "username email _id") // Populate sender details
      .populate("receiver", "username email _id") // Populate receiver details
      .lean(); // Convert to plain objects for merging

    // Sort messages by createdAt
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Collect unique user IDs from messages (excluding the authenticated user)
    const userIds = new Set();
    messages.forEach(msg => {
      if (msg.sender && msg.sender._id.toString() !== userId) {
        userIds.add(msg.sender._id.toString());
      }
      if (msg.receiver && msg.receiver._id.toString() !== userId) {
        userIds.add(msg.receiver._id.toString());
      }
    });

    // Fetch user details of people the authenticated user has exchanged messages with
    const users = await User.find({ _id: { $in: Array.from(userIds) } }, "username email _id");

    res.status(200).json({ users, messages });

  } catch (error) {
    console.error("Error fetching users and conversation history:", error);
    res.status(500).json({ message: "Error fetching users and conversation history" });
  }
});



router.get("/messages/unread/:userId", authenticateUser, async (req, res, next) => {
  try {
    console.log("hello world")
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
})
module.exports = router;
