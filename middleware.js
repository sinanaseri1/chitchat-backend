const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  console.log("Authenticating user...");
  console.log("Cookies: ", JSON.stringify(req.cookies)); // Check cookies

  const token = req.cookies?.token; // Read token from cookies

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.KEY); // Verify token
    console.log("Decoded JWT:", decoded); // Log decoded JWT

    req.user = decoded; // Attach user info to request
    console.log("Authenticated user info:", req.user); // Verify user info attached to request

    next(); // Proceed to next middleware/route
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired." });
    }
    return res.status(403).json({ message: "Invalid token." });
  }
};

module.exports = authenticateUser;
