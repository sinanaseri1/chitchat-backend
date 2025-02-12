const express = require("express");
const app = express();
const port = 3001;
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./schemas/User");
const router = express.Router();
const routes = require("./router");
dotenv.config();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000", // Adjust this in production
    credentials: true,
  })
);
app.use(cookieParser());

// MongoDB connection options
const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    await mongoose.disconnect();
    console.log("Error:", error);
  }
}

run().catch(console.dir);

// JWT Authentication Middleware
const authenticateUser = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(token, process.env.KEY);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired." });
    }
    return res.status(403).json({ message: "Invalid token." });
  }
};

app.use("/", routes); // Use your defined routes

app.get("/", (req, res) => {
  res.send("Hello World");
});

// ----- Socket.IO Integration ----- //

// Create an HTTP server from the Express app
const http = require("http");
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust this to your frontend URL in production
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Setup Socket.IO event listeners
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  // Listen for incoming chat messages from clients
  socket.on("chat message", (msg) => {
    console.log("Message received: " + msg);
    // Broadcast the message to all other connected clients
    socket.broadcast.emit("chat message", msg);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

// Start the HTTP server (with Socket.IO) instead of app.listen
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
