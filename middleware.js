const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  console.log("authenticating user...")
  console.log("Cookies: ", JSON.stringify(req.cookies)); // Debugging: Check if cookies are set
  const token = req.cookies?.token; // Read token from cookies

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.KEY); // Verify token
    req.user = decoded; // Attach user info to request
    next(); // Proceed to next middleware/route
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired." });
    }
    return res.status(403).json({ message: "Invalid token." });
  }
};

module.exports = authenticateUser;
