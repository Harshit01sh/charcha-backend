import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import models from "../models/index.js";

dotenv.config();

const User = models.users; // sequelize-auto generates lowercase table names

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ username, email, password: hashedPassword });

    res.status(201).json({ message: "✅ User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: "❌ User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "❌ Invalid credentials" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "✅ Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
