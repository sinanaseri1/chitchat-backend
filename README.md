# Messaging App Backend

This is the backend code for a simple messaging app using Node.js, Express, MongoDB, and Socket.IO. It provides the necessary endpoints and real-time communication functionality for a messaging system, where users can send and receive private messages and join real-time chatrooms.

## Project Structure

```
.
├── controllers/
├── schemas/
│   ├── Message.js
│   └── User.js
├── .gitignore
├── README.md
├── controller.js
├── index.js
├── middleware.js
├── package-lock.json
└── package.json
```

### Key Files and Directories

- `controllers/`: Contains all controller logic (if there are any defined actions for specific routes).
- `schemas/`: Contains the Mongoose schemas for the database models (Message, User).
- `.gitignore`: Specifies which files and folders to ignore in version control.
- `controller.js`: Contains controller logic for handling routes (if any).
- `index.js`: The entry point for the backend application. It initializes the Express server, connects to MongoDB, and sets up Socket.IO for real-time messaging.
- `middleware.js`: Contains any middleware (such as JWT authentication) used in the app.
- `package.json`: Lists all the project dependencies.
- `package-lock.json`: Automatically generated file to lock dependencies to specific versions.

## Dependencies

- `express`: Framework for building the web server.
- `cookie-parser`: Middleware for parsing cookies in requests.
- `mongoose`: ODM for MongoDB to interact with the database.
- `dotenv`: Loads environment variables from a `.env` file.
- `cors`: Middleware for enabling Cross-Origin Resource Sharing (CORS).
- `bcryptjs`: A library to hash and compare passwords securely.
- `jsonwebtoken`: For creating and verifying JSON Web Tokens (JWT).
- `socket.io`: For real-time, bi-directional communication between clients and server.

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd messaging-app-backend
