const express = require("express");
const  { registerUser, loginUser } = require("../controllers/authController.js");
const upload = require("../middlewares/uploadMiddleware.js");

const router = express.Router();

router.post("/register",upload.single('file'), registerUser);
router.post("/login", loginUser);

module.exports = router;
