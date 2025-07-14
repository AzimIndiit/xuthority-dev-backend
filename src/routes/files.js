const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const { uploadMiddleware } = require("../middleware/upload");
const { uploadArray } = require("../middleware/upload");
const authenticate = require("../middleware/auth");

// POST /api/v1/files/upload
/**
 * @openapi
 * /files/upload:
 *   post:
 *     summary: Upload a single file
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileId:
 *                       type: string
 *                       description: Unique file identifier
 *                     fileName:
 *                       type: string
 *                       description: Original file name
 *                     fileSize:
 *                       type: number
 *                       description: File size in bytes
 *                     fileType:
 *                       type: string
 *                       description: MIME type of the file
 *                     uploadDate:
 *                       type: string
 *                       format: date-time
 *                       description: Upload timestamp
 *                     fileUrl:
 *                       type: string
 *                       description: URL to access the uploaded file
 *                 message:
 *                   type: string
 *                   example: "File uploaded successfully"
 *       400:
 *         description: Bad request - Invalid file or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Invalid file type or size"
 *                     code:
 *                       type: string
 *                       example: "FILE_VALIDATION_ERROR"
 *                     statusCode:
 *                       type: integer
 *                       example: 400
 *                     details:
 *                       type: object
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Authentication required"
 *                     code:
 *                       type: string
 *                       example: "UNAUTHORIZED"
 *                     statusCode:
 *                       type: integer
 *                       example: 401
 *       413:
 *         description: Payload too large - File size exceeds limit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "File size exceeds maximum limit"
 *                     code:
 *                       type: string
 *                       example: "FILE_TOO_LARGE"
 *                     statusCode:
 *                       type: integer
 *                       example: 413
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Internal server error"
 *                     code:
 *                       type: string
 *                       example: "INTERNAL_ERROR"
 *                     statusCode:
 *                       type: integer
 *                       example: 500
 */
router.post("/upload", uploadMiddleware("file"), fileController.uploadFile);

// POST /api/v1/files/upload-multiple
/**
 * @openapi
 * /files/upload-multiple:
 *   post:
 *     tags:
 *       - Files
 *     summary: Upload multiple files
 *     description: Upload multiple files (up to 5 files) to the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of files to upload (max 5 files)
 *                 minItems: 1
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           filename:
 *                             type: string
 *                             example: "document.pdf"
 *                           originalName:
 *                             type: string
 *                             example: "original-document.pdf"
 *                           mimeType:
 *                             type: string
 *                             example: "application/pdf"
 *                           size:
 *                             type: integer
 *                             example: 1024000
 *                           url:
 *                             type: string
 *                             example: "https://s3.amazonaws.com/bucket/document.pdf"
 *                           uploadedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Files uploaded successfully"
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 3
 *                     uploaded:
 *                       type: integer
 *                       example: 3
 *                     failed:
 *                       type: integer
 *                       example: 0
 *       400:
 *         description: Bad request - Invalid file data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Invalid file data"
 *                     code:
 *                       type: string
 *                       example: "INVALID_FILE_DATA"
 *                     statusCode:
 *                       type: integer
 *                       example: 400
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Authentication required"
 *                     code:
 *                       type: string
 *                       example: "UNAUTHORIZED"
 *                     statusCode:
 *                       type: integer
 *                       example: 401
 *       413:
 *         description: Payload too large - File size exceeds limit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "File size exceeds maximum limit"
 *                     code:
 *                       type: string
 *                       example: "FILE_TOO_LARGE"
 *                     statusCode:
 *                       type: integer
 *                       example: 413
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Internal server error"
 *                     code:
 *                       type: string
 *                       example: "INTERNAL_ERROR"
 *                     statusCode:
 *                       type: integer
 *                       example: 500
 */
router.post(
  "/upload-multiple",
  uploadArray("files", 5),
  fileController.uploadFile,
);

// GET /api/v1/files - Get user's files (paginated)
router.get("/", authenticate, fileController.getUserFiles);

// GET /api/v1/files/stats - Get file statistics (must come before /:id)
router.get("/stats", authenticate, fileController.getFileStats);

// GET /api/v1/files/:id - Get file by ID
router.get("/:id", authenticate, fileController.getFile);

// DELETE /api/v1/files/:id - Delete file
router.delete("/:id", authenticate, fileController.deleteFile);

module.exports = router;
