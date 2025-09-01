import models from "../models/index.js";

const Upload = models.uploads; // assuming "uploads" table exists

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = `/uploads/${req.file.filename}`;
    await Upload.create({ filename: req.file.originalname, path: filePath });

    res.json({ message: "✅ File uploaded successfully", file: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
