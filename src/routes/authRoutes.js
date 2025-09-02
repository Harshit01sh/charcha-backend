import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/register",upload.single("image"), registerUser);
router.post("/login", loginUser);

export default router;
