const multer = require("multer");
const { Upload } = require("@aws-sdk/lib-storage");
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require("path");
const ApiError = require("../utils/apiError");
const s3 = require("../config/aws");
const imageProcessingService = require("../services/imageProcessingService");
const videoProcessingService = require("../services/videoProcessingService");

// Use specific MIME types instead of wildcards - updated to be more flexible
const allowedMimeTypes = [
  // Image formats
  "image/jpeg",
  "image/jpg",     // Some browsers report this
  "image/pjpeg",   // Progressive JPEG
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",     // Added BMP support
  "image/tiff",    // Added TIFF support
  "image/tif",     // Alternative TIFF extension
  
  // Document formats
  "application/pdf",
  
  // Video formats
  "video/mp4",
  "video/mpeg",
  "video/mpg",
  "video/quicktime",
  "video/avi",
  "video/mov",
  "video/wmv",
  "video/flv",
  "video/webm",
  "video/mkv",
  "video/3gp",
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
      `Invalid file type: ${file.mimetype}. Supported formats: JPEG, PNG, GIF, WebP, BMP, TIFF, PDF, and video files (MP4, AVI, MOV, etc.).`,
      "INVALID_FILE_TYPE",
      400,
    );
    cb(error, false);
  }
};

// Function to upload file to S3 using AWS SDK v3
const uploadToS3 = async (buffer, filename, contentType, metadata = {}) => {
  try {
    // For large files, use multipart upload
    if (buffer.length > CHUNK_SIZE) {
      const upload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: filename,
          Body: buffer,
          ContentType: contentType,
          ACL: "public-read",
          Metadata: metadata,
        },
        queueSize: 4,
        partSize: CHUNK_SIZE,
        leavePartsOnError: false,
      });

      const result = await upload.done();
      return result;
    } else {
      // For smaller files, use simple upload
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
        Metadata: metadata,
      };

      const result = await s3.send(new PutObjectCommand(uploadParams));
      return {
        Location: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`,
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        ETag: result.ETag,
        VersionId: result.VersionId,
      };
    }
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new ApiError(
      "Failed to upload file to cloud storage",
      "S3_UPLOAD_FAILED",
      500,
    );
  }
};

// Function to process and upload video variants
const processAndUploadVideo = async (file, fieldName) => {
  try {
    const processingStartTime = Date.now();
    
    // Generate video variants
    const result = await videoProcessingService.generateVideoVariants(
      file.buffer,
      {
        createThumbnail: true,
        compressVideo: true,
        qualities: ['medium', 'high'], // Generate medium and high quality
        thumbnailOptions: { width: 320, height: 240, format: 'webp' }
      }
    );

    const { variants, metadata, processingTime } = result;
    
    // Upload variants to S3
    const uploadedVariants = {};
    const timestamp = Date.now();
    const baseFilename = `${timestamp}-${fieldName}`;
    
    // Upload compressed video qualities
    for (const [quality, videoData] of Object.entries(variants)) {
      if (quality === 'thumbnail') continue; // Handle thumbnail separately
      
      const videoFilename = `uploads/videos/${quality}/${baseFilename}.mp4`;
      const videoResult = await uploadToS3(
        videoData.buffer,
        videoFilename,
        videoData.mimeType,
        {
          'original-size': file.size.toString(),
          'compression-ratio': videoData.compressionRatio,
          'processing-time': videoData.processingTime.toString(),
          'quality': quality
        }
      );
      
      uploadedVariants[quality] = {
        url: videoResult.Location,
        s3Key: videoFilename,
        mimeType: videoData.mimeType,
        size: videoData.size,
        dimensions: metadata.video ? {
          width: metadata.video.width,
          height: metadata.video.height
        } : null
      };
    }
    
    // Upload thumbnail
    if (variants.thumbnail) {
      const thumbnailFilename = `uploads/video-thumbnails/${baseFilename}.webp`;
      const thumbnailResult = await uploadToS3(
        variants.thumbnail.buffer,
        thumbnailFilename,
        variants.thumbnail.mimeType,
        {
          'variant-type': 'video-thumbnail',
          'original-size': file.size.toString()
        }
      );
      
      uploadedVariants.thumbnail = {
        url: thumbnailResult.Location,
        s3Key: thumbnailFilename,
        mimeType: variants.thumbnail.mimeType,
        size: variants.thumbnail.size,
        dimensions: variants.thumbnail.dimensions
      };
    }
    
    // Upload original video (optional - for backup purposes)
    const originalExt = path.extname(file.originalname);
    const originalFilename = `uploads/videos/originals/${baseFilename}${originalExt}`;
    const originalResult = await uploadToS3(
      file.buffer,
      originalFilename,
      file.mimetype,
      {
        'variant-type': 'original',
        'file-size': file.size.toString()
      }
    );
    
    return {
      // Main file properties (use medium quality as primary)
      key: uploadedVariants.medium?.s3Key || uploadedVariants.high?.s3Key || originalFilename,
      location: uploadedVariants.medium?.url || uploadedVariants.high?.url || originalResult.Location,
      bucket: process.env.AWS_S3_BUCKET,
      etag: originalResult.ETag,
      versionId: originalResult.VersionId,
      
      // Video-specific properties
      isVideo: true,
      originalDimensions: metadata.video ? {
        width: metadata.video.width,
        height: metadata.video.height
      } : null,
      videoMetadata: {
        duration: metadata.duration,
        fps: metadata.video?.fps,
        bitrate: metadata.bitrate,
        format: metadata.format,
        videoCodec: metadata.video?.codec,
        audioCodec: metadata.audio?.codec,
        audioChannels: metadata.audio?.channels,
        audioSampleRate: metadata.audio?.sampleRate
      },
      variants: uploadedVariants,
      processingMetadata: {
        compressionRatio: variants.medium?.compressionRatio || variants.high?.compressionRatio || '0%',
        processedAt: new Date(),
        processingTime: processingTime + (Date.now() - processingStartTime),
        originalSize: file.size
      }
    };
    
  } catch (error) {
    console.error("Video processing and upload error:", error);
    
    // Fallback: upload original file without processing
    console.log("Falling back to original video upload...");
    const ext = path.extname(file.originalname);
    const filename = `uploads/videos/fallback/${Date.now()}-${fieldName}${ext}`;
    
    const result = await uploadToS3(file.buffer, filename, file.mimetype);
    
    return {
      key: filename,
      location: result.Location,
      bucket: result.Bucket,
      etag: result.ETag,
      versionId: result.VersionId,
      isVideo: videoProcessingService.isVideo(file.mimetype),
      processingMetadata: {
        error: error.message,
        processedAt: new Date(),
        originalSize: file.size
      }
    };
  }
};

// Function to process and upload image variants
const processAndUploadImage = async (file, fieldName) => {
  try {
    const processingStartTime = Date.now();
    
    // Validate image constraints
    await imageProcessingService.validateImageConstraints(file.buffer);
    
    // Generate image variants
    const variants = await imageProcessingService.generateImageVariants(
      file.buffer,
      file.mimetype,
      {
        createThumbnail: true,
        thumbnailSize: { width: 300, height: 300 },
        compressOriginal: true,
        keepOriginal: false // We'll store original in the main file record
      }
    );

    const processingTime = Date.now() - processingStartTime;
    
    // Upload variants to S3
    const uploadedVariants = {};
    const timestamp = Date.now();
    const baseFilename = `${timestamp}-${fieldName}`;
    
    // Upload compressed version
    if (variants.compressed) {
      const compressedFilename = `uploads/compressed/${baseFilename}.${variants.compressed.extension}`;
      const compressedResult = await uploadToS3(
        variants.compressed.buffer,
        compressedFilename,
        variants.compressed.mimeType,
        {
          'original-size': file.size.toString(),
          'compression-ratio': variants.compressed.compressionRatio,
          'processing-time': processingTime.toString()
        }
      );
      
      uploadedVariants.compressed = {
        url: compressedResult.Location,
        s3Key: compressedFilename,
        mimeType: variants.compressed.mimeType,
        size: variants.compressed.size,
        dimensions: variants.compressed.dimensions
      };
    }
    
    // Upload thumbnail
    if (variants.thumbnail) {
      const thumbnailFilename = `uploads/thumbnails/${baseFilename}.webp`;
      const thumbnailResult = await uploadToS3(
        variants.thumbnail.buffer,
        thumbnailFilename,
        variants.thumbnail.mimeType,
        {
          'variant-type': 'thumbnail',
          'original-size': file.size.toString()
        }
      );
      
      uploadedVariants.thumbnail = {
        url: thumbnailResult.Location,
        s3Key: thumbnailFilename,
        mimeType: variants.thumbnail.mimeType,
        size: variants.thumbnail.size,
        dimensions: variants.thumbnail.dimensions
      };
    }
    
    // Upload original (optional - for backup purposes)
    const originalExt = path.extname(file.originalname);
    const originalFilename = `uploads/originals/${baseFilename}${originalExt}`;
    const originalResult = await uploadToS3(
      file.buffer,
      originalFilename,
      file.mimetype,
      {
        'variant-type': 'original',
        'file-size': file.size.toString()
      }
    );
    
    // Get original image dimensions
    const originalMetadata = await imageProcessingService.processImage(
      file.buffer,
      file.mimetype,
      { convertToWebP: false }
    );
    
    return {
      // Main file properties (use compressed version as primary)
      key: uploadedVariants.compressed?.s3Key || originalFilename,
      location: uploadedVariants.compressed?.url || originalResult.Location,
      bucket: process.env.AWS_S3_BUCKET,
      etag: originalResult.ETag,
      versionId: originalResult.VersionId,
      
      // Image-specific properties
      isImage: true,
      originalDimensions: originalMetadata.originalDimensions,
      variants: uploadedVariants,
      processingMetadata: {
        compressionRatio: variants.compressed?.compressionRatio || '0%',
        processedAt: new Date(),
        processingTime,
        originalSize: file.size
      }
    };
    
  } catch (error) {
    console.error("Image processing and upload error:", error);
    
    // Fallback: upload original file without processing
    console.log("Falling back to original file upload...");
    const ext = path.extname(file.originalname);
    const filename = `uploads/fallback/${Date.now()}-${fieldName}${ext}`;
    
    const result = await uploadToS3(file.buffer, filename, file.mimetype);
    
    return {
      key: filename,
      location: result.Location,
      bucket: result.Bucket,
      etag: result.ETag,
      versionId: result.VersionId,
      isImage: imageProcessingService.isImage(file.mimetype),
      processingMetadata: {
        error: error.message,
        processedAt: new Date(),
        originalSize: file.size
      }
    };
  }
};

// Function to upload non-image files
const uploadRegularFile = async (file, fieldName) => {
  try {
    const ext = path.extname(file.originalname);
    const filename = `uploads/${Date.now()}-${fieldName}${ext}`;

    console.log("Uploading regular file to S3:", filename);
    const result = await uploadToS3(file.buffer, filename, file.mimetype);

    return {
      key: filename,
      location: result.Location,
      bucket: result.Bucket,
      etag: result.ETag,
      versionId: result.VersionId,
      isImage: false
    };
  } catch (error) {
    console.error("Regular file upload error:", error);
    throw error;
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
                  413,
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

      // If file was uploaded successfully, process and upload to S3
      if (req.file) {
        try {
          let uploadResult;
          
          // Check file type and process accordingly
          if (imageProcessingService.isImage(req.file.mimetype)) {
            console.log("Processing image file:", req.file.originalname);
            uploadResult = await processAndUploadImage(req.file, fieldName);
          } else if (videoProcessingService.isVideo(req.file.mimetype)) {
            console.log("Processing video file:", req.file.originalname);
            uploadResult = await processAndUploadVideo(req.file, fieldName);
          } else {
            console.log("Uploading regular file:", req.file.originalname);
            uploadResult = await uploadRegularFile(req.file, fieldName);
          }

          // Replace multer file object with S3 result
          req.file = {
            ...req.file,
            ...uploadResult
          };

          console.log("Upload successful:", req.file.location);
        } catch (uploadError) {
          console.error("S3 upload error:", uploadError);
          return next(uploadError);
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
                  413,
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

      // If files were uploaded successfully, process and upload each to S3
      if (req.files && req.files.length > 0) {
        try {
          const uploadPromises = req.files.map(async (file, index) => {
            let uploadResult;
            
            // Check file type and process accordingly
            if (imageProcessingService.isImage(file.mimetype)) {
              console.log(`Processing image file ${index + 1}:`, file.originalname);
              uploadResult = await processAndUploadImage(file, `${fieldName}-${index}`);
            } else if (videoProcessingService.isVideo(file.mimetype)) {
              console.log(`Processing video file ${index + 1}:`, file.originalname);
              uploadResult = await processAndUploadVideo(file, `${fieldName}-${index}`);
            } else {
              console.log(`Uploading regular file ${index + 1}:`, file.originalname);
              uploadResult = await uploadRegularFile(file, `${fieldName}-${index}`);
            }

            return {
              ...file,
              ...uploadResult
            };
          });

          req.files = await Promise.all(uploadPromises);
          console.log("All uploads successful");
        } catch (uploadError) {
          console.error("Multiple file upload error:", uploadError);
          return next(uploadError);
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
