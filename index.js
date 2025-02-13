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

// Import the Message model (for storing chat messages)
const Message = require("./schemas/Message");

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
    console.log("Error connecting to MongoDB:", error);
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

// Map to keep track of online users (userId -> socket.id)
const onlineUsers = new Map();

// Setup Socket.IO event listeners
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  // Listen for registration to map userId to socket.id
  socket.on("register", async (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);

    // Fetch any unread messages from the database for this user
    const unreadMessages = await Message.find({ receiver: userId, read: false });
    if (unreadMessages.length > 0) {
      // Emit the unread messages to the user
      socket.emit("unreadMessages", unreadMessages);
      console.log(`Emitted ${unreadMessages.length} unread messages to user ${userId}`);

      // Optionally, mark those messages as read
      await Message.updateMany({ receiver: userId, read: false }, { $set: { read: true } });
    }
  });

  // Listen for incoming private messages from clients
  socket.on("privateMessage", async ({ senderId, receiverId, text }) => {
    console.log("Received privateMessage event:", {
      senderId,
      receiverId,
      text,
    });

    try {
      if (!text || !text.trim()) {
        console.log("Message text is empty, aborting save.");
        return;
      }

      // Create and save the message in MongoDB
      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        text: text,
      });
      console.log("Saving message to MongoDB:", message);
      await message.save();
      console.log("Message saved successfully:", message);

      // If the receiver is online, emit the message to them
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("privateMessage", {
          senderId,
          receiverId,
          text,
          createdAt: message.createdAt,
        });
        console.log(
          `Emitted message to receiver ${receiverId} at socket ${receiverSocketId}`
        );
      } else {
        console.log(
          `Receiver ${receiverId} is offline, message saved to database.`
        );
        // Optionally, you could store this message in an "offline message queue" 
        // for later delivery if needed. This part is not necessary if you already 
        // save to the database.
      }
    } catch (error) {
      console.error("Error sending private message:", error);
    }
  });

  // Optional: Listen for a generic "chat message" event for broadcast messages
  socket.on("chat message", (msg) => {
    console.log("Message received (chat message): " + msg);
    socket.broadcast.emit("chat message", msg);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
    for (const [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} removed from online users`);
        break;
      }
    }
  });
});

// Start the HTTP server (with Socket.IO) instead of app.listen
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
