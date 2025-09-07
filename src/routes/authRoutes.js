const express = require("express");
const  { registerUser, loginUser,logoutUser, forgotPassword,changePassword } = require("../controllers/authController.js");
const upload = require("../middlewares/uploadMiddleware.js");

const router = express.Router();

router.post("/register",upload.single('file'), registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser); 
router.post("/forgot-password", forgotPassword);
router.post("/change-password",changePassword)

module.exports = router;
