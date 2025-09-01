import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import { uploadFile } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/file", upload.single("file"), uploadFile);

export default router;
