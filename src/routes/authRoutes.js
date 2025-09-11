const express = require("express");
const  { registerUser, loginUser,logoutUser, forgotPassword,changePassword } = require("../controllers/authController.js");
const upload = require("../middlewares/uploadMiddleware.js");
const auth = require("./../middlewares/authMiddleware");
const userController = require("./../controllers/authController.js");
const router = express.Router();

router.post("/register",upload.single('file'), registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser); 
router.post("/forgot-password", forgotPassword);
router.post("/change-password",changePassword);

router.post("/block", auth, userController.blockUser);
router.post("/unblock", auth, userController.unblockUser);
router.get("/blocked", auth, userController.getBlockedUsers);

module.exports = router;
