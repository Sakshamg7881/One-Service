/**
 * OneService – Upload Routes (Cloudinary)
 */
const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { protect } = require("../middleware/auth.middleware");

console.log("CLOUDINARY_CLOUD_NAME =", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY =", process.env.CLOUDINARY_API_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only images and PDFs are allowed."));
  },
});

// POST /api/upload/image
router.post("/image", protect, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file provided." });

    const folder = req.body.folder || "oneservice/general";
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto", quality: "auto", fetch_format: "auto" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    res.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (err) { next(err); }
});

// POST /api/upload/multiple
router.post("/multiple", protect, upload.array("files", 5), async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: "No files provided." });

    const folder = req.body.folder || "oneservice/general";
    const uploads = await Promise.all(
      req.files.map((file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "auto", quality: "auto" },
            (error, result) => (error ? reject(error) : resolve({ url: result.secure_url, publicId: result.public_id }))
          );
          stream.end(file.buffer);
        })
      )
    );

    res.json({ success: true, files: uploads });
  } catch (err) { next(err); }
});

module.exports = router;
