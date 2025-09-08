const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

module.exports =  authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: "❌ No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email }

    next();
  } catch (err) {
    return res.status(403).json({ error: "❌ Invalid or expired token" });
  }
};
