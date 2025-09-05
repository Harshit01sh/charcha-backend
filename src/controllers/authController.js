const bcrypt =  require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const db = require("../models/index.js");  // import full models (not just user.models.js)

dotenv.config();

const User = db.Users; // Sequelize User model

// 🔹 Register User
module.exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(req.file,"file");
    // check if user already exists (by email)
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "❌ Email already registered" });
    }

    // multer adds file info into req.file
    let imageUrl = null;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    // hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // create user
    const newUser = await User.create({
      name,
      email,
      passwordHash,
      image: imageUrl,
    });

    // generate token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "✅ User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        image: newUser.image,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Login User
module.exports.loginUser = async (req, res)  => {
  try {
    const { email, password } = req.body;

    console.log(email,password);
    // find user
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: "❌ User not found" });

    // check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "❌ Invalid credentials" });

    // generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "✅ Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



module.exports.logoutUser = async (req, res) => {
  try {
    console.log(res)
    res.json({ message: "✅ Logout successful. Please clear token on client." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};