const express = require("express");
const  { registerUser, loginUser } = require("../controllers/authController.js");
const upload = require("../middlewares/uploadMiddleware.js");

const router = express.Router();

router.post("/register",upload.single("image"), registerUser);
router.post("/login", loginUser);

export default router;
