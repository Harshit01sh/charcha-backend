const bcrypt =  require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const db = require("../models/index.js");  // import full models (not just user.models.js)
const nodemailer = require("nodemailer");

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
        ProfileUrl: user.image,
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




// Utility: generate random 8-character password
function generateRandomPassword(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// 🔹 Forgot Password
module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    console.log(email);
    // find user)

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });
    console.log(user);

    const newPassword = generateRandomPassword(8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await User.update(
      { passwordHash: hashedPassword },
      { where: { email } }
    );
    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // const mailOptions = {
    //   from: `"ChatApp Support" <${process.env.SMTP_USER}>`,
    //   to: user.email,
    //   subject: "ChatApp Password Reset",
    //   text: `Your temporary password is: ${newPassword}\n\nPlease login and change your password immediately.`,
    // };

    const mailOptions = {
  from: `"ChatApp Support" <${process.env.SMTP_USER}>`,
  to: user.email,
  subject: "🔑 Password Reset Instructions - ChatApp",
  html: `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #4CAF50;">Dear ${user.name || "User"},</h2>
      <p>
        We received a request to reset your <b>Charcha App</b> account password.
      </p>
      <p>
        Your new <b>temporary password</b> is:
      </p>
      <div style="padding: 10px; background: #f4f4f4; border-radius: 5px; font-size: 18px; font-weight: bold; text-align: center;">
        ${newPassword}
      </div>
      <p>
        Please use this password to log in to your account. 
        For your security, we recommend changing your password immediately after logging in.
      </p>
      <p>
        If you did not request this password reset, please ignore this email or contact our support team immediately.
      </p>
      <br />
      <p>
        Best regards, <br />
        <b>ChatApp Support Team</b>
      </p>
      <hr />
      <small style="color: #777;">
        This is an automated message. Please do not reply directly to this email.
      </small>
    </div>
  `,
};

    await transporter.sendMail(mailOptions);

    res.json({
      message: "✅ Temporary password sent to your email. Login with it and change password.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};