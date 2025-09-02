import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authMiddleware = (req, res, next) => {
  try {
    // Get token from header (Authorization: Bearer <token>)
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "❌ No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user data to request (can use later in controllers)
    req.user = decoded; // contains { id, email } from login/register

    next();
  } catch (err) {
    return res.status(403).json({ error: "❌ Invalid or expired token" });
  }
};
