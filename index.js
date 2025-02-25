// const express = require("express");
// const app = express();
// const port = 3001;
// const cookieParser = require("cookie-parser");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("./schemas/User");
// const router = express.Router();
// const routes = require("./router");
// dotenv.config();

// // Import the Message model (for storing chat messages)
// const Message = require("./schemas/Message");

// // Middleware
// app.use(express.json());
// app.use(
//   cors({
//     origin: [
//       "http://localhost:3000",
//       "https://capable-swan-50b68e.netlify.app",
//     ], 

//     credentials: true,
//   })
// );
// app.use(cookieParser());

// // MongoDB connection options
// const clientOptions = {
//   serverApi: { version: "1", strict: true, deprecationErrors: true },
// };

// async function run() {
//   try {
//     await mongoose.connect(process.env.MONGODB_URL, clientOptions);
//     await mongoose.connection.db.admin().command({ ping: 1 });
//     console.log(
//       "Pinged your deployment. You successfully connected to MongoDB!"
//     );
//   } catch (error) {
//     await mongoose.disconnect();
//     console.log("Error connecting to MongoDB:", error);
//   }
// }

// run().catch(console.dir);

// // JWT Authentication Middleware
// const authenticateUser = (req, res, next) => {
//   const token = req.cookies?.token;
//   if (!token) {
//     return res
//       .status(401)
//       .json({ message: "Access denied. No token provided." });
//   }
//   try {
//     const decoded = jwt.verify(token, process.env.KEY);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({ message: "Token has expired." });
//     }
//     return res.status(403).json({ message: "Invalid token." });
//   }
// };

// app.use("/", routes); // Use your defined routes

// app.get("/", (req, res) => {
//   res.send("Hello World");
// });

// // ----- Socket.IO Integration ----- //

// // Create an HTTP server from the Express app
// const http = require("http");
// const server = http.createServer(app);

// // Attach Socket.IO to the HTTP server
// const { Server } = require("socket.io");
// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:3000",
//       "https://capable-swan-50b68e.netlify.app",
//     ], 
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// // Map to keep track of online users (userId -> socket.id)
// const onlineUsers = new Map();

// // Setup Socket.IO event listeners
// io.on("connection", (socket) => {
//   console.log("A user connected: " + socket.id);

//   // Listen for registration to map userId to socket.id
//   socket.on("register", async (userId) => {
//     onlineUsers.set(userId, socket.id);
//     console.log(`User ${userId} registered with socket ${socket.id}`);

//     try {
//       // Fetch any unread messages from the database for this user
//       const unreadMessages = await Message.find({
//         receiver: userId,
//         read: false,
//       });
//       if (unreadMessages.length > 0) {
//         // Emit the unread messages to the user
//         socket.emit("unreadMessages", unreadMessages);
//         console.log(
//           `Emitted ${unreadMessages.length} unread messages to user ${userId}`
//         );
//       }

//       // Optionally, mark those messages as read after emitting
//       await Message.updateMany(
//         { receiver: userId, read: false },
//         { $set: { read: true } }
//       );
//     } catch (error) {
//       console.error("Error fetching unread messages:", error);
//     }
//   });

//   // Listen for incoming private messages from clients
//   socket.on("privateMessage", async ({ senderId, receiverId, text }) => {
//     console.log("Received privateMessage event:", {
//       senderId,
//       receiverId,
//       text,
//     });

//     try {
//       if (!text || !text.trim()) {
//         console.log("Message text is empty, aborting save.");
//         return;
//       }

//       // Create and save the message in MongoDB
//       const message = await new Message({
//         sender: senderId,
//         receiver: receiverId,
//         text,
//       }).save();

//       console.log("Message saved successfully:", message);

//       const activeUser = await User.findById(senderId);
//       if (activeUser) {
//         activeUser.messages.push(message._id);
//         await activeUser.save();
//         console.log("Message ID added to active user:", activeUser._id);
//       } else {
//         console.error("User not found:", senderId);
//       }

//       // If the receiver is online, emit the message to them
//       const receiverSocketId = onlineUsers.get(receiverId);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("privateMessage", {
//           senderId,
//           receiverId,
//           text,
//           createdAt: message.createdAt,
//         });
//         console.log(
//           `Emitted message to receiver ${receiverId} at socket ${receiverSocketId}`
//         );
//       } else {
//         console.log(
//           `Receiver ${receiverId} is offline, message saved to database.`
//         );
//         // Optionally, you could store this message in an "offline message queue"
//         // for later delivery if needed. This part is not necessary if you already
//         // save to the database.
//       }
//     } catch (error) {
//       console.error("Error sending private message:", error);
//     }
//   });

//   // Optional: Listen for a generic "chat message" event for broadcast messages
//   socket.on("chat message", (msg) => {
//     console.log("Message received (chat message): " + msg);
//     socket.broadcast.emit("chat message", msg);
//   });

//   // Handle disconnection
//   socket.on("disconnect", () => {
//     console.log("User disconnected: " + socket.id);
//     for (const [userId, sId] of onlineUsers.entries()) {
//       if (sId === socket.id) {
//         onlineUsers.delete(userId);
//         console.log(`User ${userId} removed from online users`);
//         break;
//       }
//     }
//   });
// });

// // Start the HTTP server (with Socket.IO) instead of app.listen
// server.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });


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
const Message = require("./schemas/Message");
dotenv.config();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://capable-swan-50b68e.netlify.app",
    ],
    credentials: true,
  })
);

// MongoDB connection options
const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(
      "Pinged your deployment. Successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    await mongoose.disconnect();
  }
}

run().catch(console.dir);

// ----- JWT Authentication Middleware ----- //
const authenticateUser = (req, res, next) => {
  console.log("Authenticating user...");
  console.log("Cookies: ", JSON.stringify(req.cookies));

  const token = req.cookies?.authToken; // Ensure consistency with token naming

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.KEY);
    console.log("Decoded JWT:", decoded);
    req.user = decoded;
    console.log("Authenticated user:", req.user);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired." });
    }
    return res.status(403).json({ message: "Invalid token." });
  }
};

// ----- Login Route ----- //
app.post("/login", async (req, res) => {
  const { usernameOrEmail, password, isMobile } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.KEY,
      { expiresIn: "1h" }
    );

    if (isMobile) {
      return res.json({ token });
    } else {
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      return res.json({ message: "Login successful" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

// Use external routes
const routes = require("./router");
app.use("/", routes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

// ----- Socket.IO Integration ----- //
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://capable-swan-50b68e.netlify.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Map to track online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  socket.on("register", async (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);

    try {
      const unreadMessages = await Message.find({ receiver: userId, read: false });
      if (unreadMessages.length > 0) {
        socket.emit("unreadMessages", unreadMessages);
        console.log(`Emitted ${unreadMessages.length} unread messages to user ${userId}`);
      }

      await Message.updateMany({ receiver: userId, read: false }, { $set: { read: true } });
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  });

  socket.on("privateMessage", async ({ senderId, receiverId, text }) => {
    console.log("Received privateMessage event:", { senderId, receiverId, text });

    try {
      if (!text || !text.trim()) {
        console.log("Message text is empty, aborting save.");
        return;
      }

      const message = await new Message({ sender: senderId, receiver: receiverId, text }).save();
      console.log("Message saved successfully:", message);

      const activeUser = await User.findById(senderId);
      if (activeUser) {
        activeUser.messages.push(message._id);
        await activeUser.save();
        console.log("Message ID added to active user:", activeUser._id);
      } else {
        console.error("User not found:", senderId);
      }

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("privateMessage", {
          senderId,
          receiverId,
          text,
          createdAt: message.createdAt,
        });
        console.log(`Emitted message to receiver ${receiverId} at socket ${receiverSocketId}`);
      } else {
        console.log(`Receiver ${receiverId} is offline, message saved to database.`);
      }
    } catch (error) {
      console.error("Error sending private message:", error);
    }
  });

  socket.on("chat message", (msg) => {
    console.log("Message received (chat message): " + msg);
    socket.broadcast.emit("chat message", msg);
  });

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

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
