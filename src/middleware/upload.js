const multer = require("multer");
const { Upload } = require("@aws-sdk/lib-storage");
const path = require("path");
const ApiError = require("../utils/apiError");
const s3 = require("../config/aws");

// Use specific MIME types instead of wildcards
const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/avi",
];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for multipart upload

const fileFilter = (req, file, cb) => {
  console.log("Uploaded file:", file);

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Pass error directly to callback with false
    const error = new ApiError(
      `Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF, PDF, and video files are allowed.`,
      "INVALID_FILE_TYPE",
      400,
    );
    cb(error, false);
  }
};

// Function to upload file to S3 using AWS SDK v3 (without progress)
const uploadToS3 = async (file, filename) => {
  try {
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      },
      queueSize: 4,
      partSize: CHUNK_SIZE,
      leavePartsOnError: false,
    });

    const result = await upload.done();
    return result;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new ApiError(
      "Failed to upload file to cloud storage",
      "S3_UPLOAD_FAILED",
      500,
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

// Middleware wrapper to handle multer errors and S3 upload
const uploadMiddleware = (fieldName) => {
  return async (req, res, next) => {
    const uploadSingle = upload.single(fieldName);

    uploadSingle(req, res, async (err) => {
      if (err) {
        console.error("Upload error:", err);

        // Handle different types of multer errors
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case "LIMIT_FILE_SIZE":
              return next(
                new ApiError(
                  `File too large. Maximum size allowed is ${MAX_SIZE / (1024 * 1024)}MB`,
                  "FILE_TOO_LARGE",
                  400,
                ),
              );
            case "LIMIT_FILE_COUNT":
              return next(
                new ApiError("Too many files uploaded", "TOO_MANY_FILES", 400),
              );
            case "LIMIT_UNEXPECTED_FILE":
              return next(
                new ApiError(
                  `Unexpected file field. Expected field name: ${fieldName}`,
                  "UNEXPECTED_FILE_FIELD",
                  400,
                ),
              );
            case "LIMIT_PART_COUNT":
              return next(
                new ApiError(
                  "Too many parts in multipart data",
                  "TOO_MANY_PARTS",
                  400,
                ),
              );
            default:
              return next(
                new ApiError(
                  err.message || "Upload error occurred",
                  "UPLOAD_ERROR",
                  400,
                ),
              );
          }
        }

        // Handle custom errors (like from fileFilter)
        if (err instanceof ApiError) {
          return next(err);
        }

        // Handle other errors
        return next(
          new ApiError(
            err.message || "File upload failed",
            "UPLOAD_FAILED",
            500,
          ),
        );
      }

      // If file was uploaded successfully, upload to S3
      if (req.file) {
        try {
          const ext = path.extname(req.file.originalname);
          const filename = `${Date.now()}-${fieldName}${ext}`;

          console.log("Uploading to S3:", filename);
          const s3Result = await uploadToS3(req.file, filename);

          // Replace multer file object with S3 result
          req.file = {
            ...req.file,
            key: filename,
            location: s3Result.Location,
            bucket: s3Result.Bucket,
            etag: s3Result.ETag,
            versionId: s3Result.VersionId,
          };

          console.log("S3 upload successful:", req.file.location);
        } catch (s3Error) {
          return next(s3Error);
        }
      }

      next();
    });
  };
};

// Array upload middleware
const uploadArray = (fieldName, maxCount = 5) => {
  return async (req, res, next) => {
    const uploadMultiple = upload.array(fieldName, maxCount);

    uploadMultiple(req, res, async (err) => {
      if (err) {
        console.error("Upload error:", err);

        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case "LIMIT_FILE_SIZE":
              return next(
                new ApiError(
                  `File too large. Maximum size allowed is ${MAX_SIZE / (1024 * 1024)}MB`,
                  "FILE_TOO_LARGE",
                  400,
                ),
              );
            case "LIMIT_FILE_COUNT":
              return next(
                new ApiError(
                  `Too many files. Maximum ${maxCount} files allowed`,
                  "TOO_MANY_FILES",
                  400,
                ),
              );
            case "LIMIT_UNEXPECTED_FILE":
              return next(
                new ApiError(
                  `Unexpected file field. Expected field name: ${fieldName}`,
                  "UNEXPECTED_FILE_FIELD",
                  400,
                ),
              );
            default:
              return next(
                new ApiError(
                  err.message || "Upload error occurred",
                  "UPLOAD_ERROR",
                  400,
                ),
              );
          }
        }

        if (err instanceof ApiError) {
          return next(err);
        }

        return next(
          new ApiError(
            err.message || "File upload failed",
            "UPLOAD_FAILED",
            500,
          ),
        );
      }

      // If files were uploaded successfully, upload each to S3
      if (req.files && req.files.length > 0) {
        try {
          const uploadPromises = req.files.map(async (file, index) => {
            const ext = path.extname(file.originalname);
            const filename = `${Date.now()}-${index}-${fieldName}${ext}`;

            console.log(`Uploading file ${index + 1} to S3:`, filename);
            const s3Result = await uploadToS3(file, filename);

            return {
              ...file,
              key: filename,
              location: s3Result.Location,
              bucket: s3Result.Bucket,
              etag: s3Result.ETag,
              versionId: s3Result.VersionId,
            };
          });

          req.files = await Promise.all(uploadPromises);
          console.log("All S3 uploads successful");
        } catch (s3Error) {
          return next(s3Error);
        }
      }

      next();
    });
  };
};



module.exports = {
  upload,
  uploadMiddleware,
  uploadArray,
  single: uploadMiddleware,
  array: uploadArray,
};
