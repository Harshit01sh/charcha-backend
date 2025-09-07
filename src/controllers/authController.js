const bcrypt = require("bcrypt");
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
    console.log(req.file, "file");
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
module.exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(email, password);
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

    const mailOptions = {
      from: `"Charcha Support" <${process.env.SMTP_USER}>`,
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
        <b>Charcha Support Team</b>
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
      //message: "✅ Temporary password sent to your email. Login with it and change password.",
      message:"A new password has been sent to your email."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Change Password
module.exports.changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check current (old) password
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Old password is incorrect" });

    // Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await User.update(
      { passwordHash: newHashedPassword },
      { where: { email } }
    );

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });


    const mailOptions = {
      from: `"Charcha Support" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "🔒 Password Changed Successfully",
      html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:8px;">
      <h2 style="color:#2c3e50;">Password Changed Successfully ✅</h2>
      <p>Hi <b>${user.name}</b>,</p>
      <p>This is to inform you that your password for <b>Charcha App</b> was changed successfully.</p>

      <div style="background:#f8f9fa; padding:15px; border-radius:6px; margin:20px 0;">
        <p style="margin:0; font-size:15px;">If <b>you</b> made this change, no further action is required.</p>
        <p style="margin:0; font-size:15px; color:#e74c3c;">If this wasn’t you, please reset your password immediately or contact support.</p>
      </div>

      <p>You can manage your account security by logging into your account:</p>
      <a href="https://charchaapp.com/login" style="display:inline-block; padding:10px 20px; background:#2c3e50; color:#fff; text-decoration:none; border-radius:5px; margin-top:10px;">Login to Charcha App</a>

      <p style="margin-top:30px; font-size:14px; color:#777;">Thank you,<br><b>Charcha Security Team</b></p>

      <hr style="margin:20px 0;">
      <p style="font-size:12px; color:#999;">If you didn’t request this password change, please <a href="https://charchaapp.com/support" style="color:#3498db;">contact support</a> immediately.</p>
    </div>
    `,

    };
    await transporter.sendMail(mailOptions);


    res.json({ message: "✅ Password changed successfully" });
    console.log(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
