const express = require("express");
const  { registerUser, loginUser,logoutUser, forgotPassword,changePassword,updateProfile,blockUser,unblockUser,getBlockedUsers } = require("../controllers/authController.js");
const upload = require("../middlewares/uploadMiddleware.js");
const auth = require("./../middlewares/authMiddleware");
const userController = require("./../controllers/authController.js");
const router = express.Router();

router.post("/register",upload.single('file'), registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser); 
router.post("/forgot-password", forgotPassword);
router.post("/change-password",changePassword);
router.post("/update-profile", auth, upload.single("image"),updateProfile);

router.post("/block", auth,blockUser);
router.post("/unblock", auth,unblockUser);
router.get("/blocked", auth, getBlockedUsers);

module.exports = router;
