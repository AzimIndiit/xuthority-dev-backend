const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const { uploadMiddleware } = require("../middleware/upload");
const { uploadArray } = require("../middleware/upload");

// POST /api/v1/files/upload
router.post("/upload", uploadMiddleware("file"), fileController.uploadFile);

// POST /api/v1/files/upload-multiple
router.post(
  "/upload-multiple",
  uploadArray("files", 5),
  fileController.uploadFile,
);



module.exports = router;
