const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/aws');
const File = require('../models/File');
const apiResponse = require('../utils/apiResponse');
const path = require('path');
const imageProcessingService = require('../services/imageProcessingService');

exports.uploadFile = async (req, res, next) => {
  try {
    let files = [];
    if (req.file) {
      files = [req.file];
    } else if (req.files && Array.isArray(req.files)) {
      files = req.files;
    } else {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No file(s) uploaded',
          code: 'NO_FILE',
          statusCode: 400,
          details: {},
        },
      });
    }

    const uploadedFiles = [];
    for (const file of files) {
      const { 
        originalname, 
        mimetype, 
        size, 
        buffer, 
        fieldname,
        location,
        key,
        isImage,
        isVideo,
        originalDimensions,
        videoMetadata,
        variants,
        processingMetadata
      } = file;

      // Determine the main file URL (prefer compressed version for images)
      const fileUrl = location || `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      // Create file record in database
      const fileData = {
        originalName: originalname,
        mimeType: mimetype,
        size,
        url: fileUrl,
        s3Key: key,
        uploadedBy: req.user ? req.user._id : null,
        isImage: isImage || false,
        isVideo: isVideo || false,
      };

      // Add media-specific data
      if (isImage || isVideo) {
        fileData.originalDimensions = originalDimensions;
        fileData.variants = variants;
        fileData.processingMetadata = processingMetadata;
      }

      // Add video-specific data
      if (isVideo && videoMetadata) {
        fileData.videoMetadata = videoMetadata;
      }

      const dbFile = await File.create(fileData);
      
      // Prepare response data
      const responseFile = {
        id: dbFile._id,
        filename: dbFile.originalName,
        originalName: dbFile.originalName,
        mimeType: dbFile.mimeType,
        size: dbFile.size,
        url: dbFile.url,
        uploadedAt: dbFile.createdAt,
        isImage: dbFile.isImage,
        isVideo: dbFile.isVideo,
      };

      // Add image-specific response data
      if (dbFile.isImage) {
        responseFile.dimensions = dbFile.originalDimensions;
        responseFile.thumbnailUrl = dbFile.thumbnailUrl;
        responseFile.bestImageUrl = dbFile.bestImageUrl;
        responseFile.variants = {
          compressed: dbFile.variants?.compressed ? {
            url: dbFile.variants.compressed.url,
            size: dbFile.variants.compressed.size,
            dimensions: dbFile.variants.compressed.dimensions
          } : null,
          thumbnail: dbFile.variants?.thumbnail ? {
            url: dbFile.variants.thumbnail.url,
            size: dbFile.variants.thumbnail.size,
            dimensions: dbFile.variants.thumbnail.dimensions
          } : null
        };
        responseFile.processingInfo = {
          compressionRatio: dbFile.processingMetadata?.compressionRatio,
          processedAt: dbFile.processingMetadata?.processedAt,
          processingTime: dbFile.processingMetadata?.processingTime,
          originalSize: dbFile.processingMetadata?.originalSize,
          error: dbFile.processingMetadata?.error
        };
      }

      // Add video-specific response data
      if (dbFile.isVideo) {
        responseFile.dimensions = dbFile.originalDimensions;
        responseFile.thumbnailUrl = dbFile.thumbnailUrl;
        responseFile.streamingUrl = dbFile.streamingUrl;
        responseFile.duration = dbFile.videoMetadata?.duration;
        responseFile.formattedDuration = dbFile.getFormattedDuration();
        responseFile.availableQualities = dbFile.getAvailableQualities();
        responseFile.videoMetadata = dbFile.videoMetadata;
        responseFile.variants = {
          high: dbFile.variants?.high ? {
            url: dbFile.variants.high.url,
            size: dbFile.variants.high.size,
            dimensions: dbFile.variants.high.dimensions
          } : null,
          medium: dbFile.variants?.medium ? {
            url: dbFile.variants.medium.url,
            size: dbFile.variants.medium.size,
            dimensions: dbFile.variants.medium.dimensions
          } : null,
          low: dbFile.variants?.low ? {
            url: dbFile.variants.low.url,
            size: dbFile.variants.low.size,
            dimensions: dbFile.variants.low.dimensions
          } : null,
          thumbnail: dbFile.variants?.thumbnail ? {
            url: dbFile.variants.thumbnail.url,
            size: dbFile.variants.thumbnail.size,
            dimensions: dbFile.variants.thumbnail.dimensions
          } : null
        };
        responseFile.processingInfo = {
          compressionRatio: dbFile.processingMetadata?.compressionRatio,
          processedAt: dbFile.processingMetadata?.processedAt,
          processingTime: dbFile.processingMetadata?.processingTime,
          originalSize: dbFile.processingMetadata?.originalSize,
          error: dbFile.processingMetadata?.error
        };
      }

      uploadedFiles.push(responseFile);
    }

    // Return single file or array based on input
    const responseData = uploadedFiles.length === 1 ? uploadedFiles[0] : {
      files: uploadedFiles,
      meta: {
        total: uploadedFiles.length,
        uploaded: uploadedFiles.length,
        failed: 0,
        images: uploadedFiles.filter(f => f.isImage).length,
        videos: uploadedFiles.filter(f => f.isVideo).length,
        documents: uploadedFiles.filter(f => !f.isImage && !f.isVideo).length
      }
    };

    return res.status(201).json(
      apiResponse.success(
        responseData, 
        `File${uploadedFiles.length > 1 ? 's' : ''} uploaded successfully`
      )
    );
  } catch (err) {
    console.error('File upload controller error:', err);
    next(err);
  }
};

// Get file by ID
exports.getFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const file = await File.findById(id).populate('uploadedBy', 'name email');
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
          statusCode: 404,
          details: {},
        },
      });
    }

    const responseData = {
      id: file._id,
      filename: file.originalName,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url,
      uploadedAt: file.createdAt,
      uploadedBy: file.uploadedBy,
      isImage: file.isImage,
      humanReadableSize: file.getHumanReadableSize(),
      isProcessed: file.isProcessed()
    };

    // Add image-specific data
    if (file.isImage) {
      responseData.dimensions = file.originalDimensions;
      responseData.thumbnailUrl = file.thumbnailUrl;
      responseData.bestImageUrl = file.bestImageUrl;
      responseData.variants = file.variants;
      responseData.processingInfo = file.processingMetadata;
    }

    return res.status(200).json(
      apiResponse.success(responseData, 'File retrieved successfully')
    );
  } catch (err) {
    console.error('Get file controller error:', err);
    next(err);
  }
};

// Get user's files
exports.getUserFiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const userId = req.user._id;

    const filter = { uploadedBy: userId };
    
    // Filter by type
    if (type === 'images') {
      filter.isImage = true;
    } else if (type === 'videos') {
      filter.isVideo = true;
    } else if (type === 'media') {
      filter.$or = [{ isImage: true }, { isVideo: true }];
    } else if (type === 'documents') {
      filter.isImage = false;
      filter.isVideo = false;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const totalDocs = await File.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / limitNum);

    // Get files with pagination
    const files = await File.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('uploadedBy', 'name email');

    const responseData = {
      files: files.map(file => ({
        id: file._id,
        filename: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url,
        uploadedAt: file.createdAt,
        isImage: file.isImage,
        thumbnailUrl: file.isImage ? file.thumbnailUrl : null,
        bestImageUrl: file.isImage ? file.bestImageUrl : null,
        humanReadableSize: file.getHumanReadableSize(),
        isProcessed: file.isProcessed()
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalDocs,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    };

    return res.status(200).json(
      apiResponse.success(responseData, 'Files retrieved successfully')
    );
  } catch (err) {
    console.error('Get user files controller error:', err);
    next(err);
  }
};

// Delete file
exports.deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const file = await File.findOne({ _id: id, uploadedBy: userId });
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'File not found or unauthorized',
          code: 'FILE_NOT_FOUND',
          statusCode: 404,
          details: {},
        },
      });
    }

    // Delete from S3
    const deletePromises = [];
    
    // Delete main file
    if (file.s3Key) {
      deletePromises.push(
        s3.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: file.s3Key
        }))
      );
    }

    // Delete image variants
    if (file.isImage && file.variants) {
      if (file.variants.compressed?.s3Key) {
        deletePromises.push(
          s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: file.variants.compressed.s3Key
          }))
        );
      }
      
      if (file.variants.thumbnail?.s3Key) {
        deletePromises.push(
          s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: file.variants.thumbnail.s3Key
          }))
        );
      }
      
      if (file.variants.original?.s3Key) {
        deletePromises.push(
          s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: file.variants.original.s3Key
          }))
        );
      }
    }

    // Execute all deletions
    await Promise.allSettled(deletePromises);

    // Delete from database
    await File.findByIdAndDelete(id);

    return res.status(200).json(
      apiResponse.success(null, 'File deleted successfully')
    );
  } catch (err) {
    console.error('Delete file controller error:', err);
    next(err);
  }
};

// Get file stats
exports.getFileStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const stats = await File.aggregate([
      { $match: { uploadedBy: userId } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          totalImages: { $sum: { $cond: ['$isImage', 1, 0] } },
          totalVideos: { $sum: { $cond: ['$isVideo', 1, 0] } },
          totalDocuments: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$isImage', false] }, { $eq: ['$isVideo', false] }] }, 
                1, 
                0
              ] 
            } 
          },
          processedImages: { 
            $sum: { 
              $cond: [
                { $and: ['$isImage', '$variants.compressed'] }, 
                1, 
                0
              ] 
            } 
          },
          processedVideos: { 
            $sum: { 
              $cond: [
                { $and: ['$isVideo', { $or: ['$variants.medium', '$variants.high'] }] }, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalFiles: 0,
      totalSize: 0,
      totalImages: 0,
      totalVideos: 0,
      totalDocuments: 0,
      processedImages: 0,
      processedVideos: 0
    };

    // Add human readable size
    result.humanReadableSize = formatBytes(result.totalSize);

    return res.status(200).json(
      apiResponse.success(result, 'File stats retrieved successfully')
    );
  } catch (err) {
    console.error('Get file stats controller error:', err);
    next(err);
  }
};

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
