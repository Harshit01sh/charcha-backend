// const multer = require("multer");
// const path = require("path");

// // storage config
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); // save in uploads folder
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       Date.now() + path.extname(file.originalname) // unique filename
//     );
//   },
// });

// // file filter (optional: only images)
// const fileFilter = (req, file, cb) => {
//   const allowed = ["image/jpeg", "image/png", "image/jpg"];
//   if (allowed.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("❌ Only JPEG, PNG allowed"), false);
//   }
// };

// module.exports  = multer({ storage, fileFilter });

const dotenv = require("dotenv"); 
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
dotenv.config();

// ✅ Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Configure storage for multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "charcha_uploads", // cloudinary folder name
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

// ✅ Create upload middleware
const upload = multer({ storage });

module.exports = upload;


