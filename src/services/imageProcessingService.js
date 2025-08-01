const sharp = require('sharp');
const path = require('path');
const ApiError = require('../utils/apiError');

/**
 * Image Processing Service
 * Handles image compression, format conversion, and optimization
 */
class ImageProcessingService {
  constructor() {
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'tiff', 'bmp', 'svg'];
    this.maxWidth = 1920;
    this.maxHeight = 1080;
    this.quality = {
      webp: 80,
      jpeg: 85,
      png: 9 // compression level for PNG
    };
  }

  /**
   * Check if file is an image
   * @param {string} mimeType - File mime type
   * @returns {boolean}
   */
  isImage(mimeType) {
    return mimeType && (mimeType.startsWith('image/') || mimeType === 'image/svg+xml');
  }

  /**
   * Get file extension from mime type
   * @param {string} mimeType - File mime type
   * @returns {string}
   */
  getExtensionFromMimeType(mimeType) {
    const mimeMap = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/tiff': 'tiff',
      'image/bmp': 'bmp',
      'image/svg+xml': 'svg'
    };
    return mimeMap[mimeType] || 'jpg';
  }

  /**
   * Process image: compress and convert to WebP
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {string} originalMimeType - Original image mime type
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed image data
   */
  async processImage(imageBuffer, originalMimeType, options = {}) {
    try {
      if (!this.isImage(originalMimeType)) {
        throw new ApiError('File is not an image', 'INVALID_IMAGE_TYPE', 400);
      }

      // Handle SVG files differently - they don't need processing
      if (originalMimeType === 'image/svg+xml') {
        return {
          buffer: imageBuffer,
          mimeType: originalMimeType,
          extension: 'svg',
          width: null,
          height: null,
          size: imageBuffer.length
        };
      }

      const {
        convertToWebP = true,
        maxWidth = this.maxWidth,
        maxHeight = this.maxHeight,
        quality = this.quality.webp,
        maintainAspectRatio = true
      } = options;

      // Initialize Sharp instance
      let sharpInstance = sharp(imageBuffer);

      // Get image metadata
      const metadata = await sharpInstance.metadata();
      
      // Validate image
      if (!metadata.width || !metadata.height) {
        throw new ApiError('Invalid image format', 'INVALID_IMAGE_FORMAT', 400);
      }

      // Resize if necessary
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        const resizeOptions = {
          width: maxWidth,
          height: maxHeight,
          fit: maintainAspectRatio ? 'inside' : 'cover',
          withoutEnlargement: true
        };
        sharpInstance = sharpInstance.resize(resizeOptions);
      }

      // Convert to WebP or optimize original format
      let processedBuffer;
      let outputMimeType;
      let outputExtension;

      if (convertToWebP) {
        processedBuffer = await sharpInstance
          .webp({ quality: quality })
          .toBuffer();
        outputMimeType = 'image/webp';
        outputExtension = 'webp';
      } else {
        // Optimize in original format
        const originalExtension = this.getExtensionFromMimeType(originalMimeType);
        
        switch (originalExtension) {
          case 'jpg':
          case 'jpeg':
            processedBuffer = await sharpInstance
              .jpeg({ quality: this.quality.jpeg })
              .toBuffer();
            break;
          case 'png':
            processedBuffer = await sharpInstance
              .png({ compressionLevel: this.quality.png })
              .toBuffer();
            break;
          case 'webp':
            processedBuffer = await sharpInstance
              .webp({ quality: this.quality.webp })
              .toBuffer();
            break;
          default:
            // For other formats, convert to JPEG
            processedBuffer = await sharpInstance
              .jpeg({ quality: this.quality.jpeg })
              .toBuffer();
            outputMimeType = 'image/jpeg';
            outputExtension = 'jpg';
        }
        
        if (!outputMimeType) {
          outputMimeType = originalMimeType;
          outputExtension = originalExtension;
        }
      }

      // Get processed image metadata
      const processedMetadata = await sharp(processedBuffer).metadata();

      const compressionRatio = ((imageBuffer.length - processedBuffer.length) / imageBuffer.length * 100).toFixed(2);

      return {
        buffer: processedBuffer,
        mimeType: outputMimeType,
        extension: outputExtension,
        size: processedBuffer.length,
        originalSize: imageBuffer.length,
        compressionRatio: `${compressionRatio}%`,
        dimensions: {
          width: processedMetadata.width,
          height: processedMetadata.height
        },
        originalDimensions: {
          width: metadata.width,
          height: metadata.height
        }
      };

    } catch (error) {
      console.error('Image processing error:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        `Image processing failed: ${error.message}`,
        'IMAGE_PROCESSING_ERROR',
        500
      );
    }
  }

  /**
   * Create thumbnail from image
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {Object} options - Thumbnail options
   * @returns {Promise<Object>} Thumbnail data
   */
  async createThumbnail(imageBuffer, options = {}) {
    try {
      const {
        width = 300,
        height = 300,
        quality = 70,
        format = 'webp'
      } = options;

      let sharpInstance = sharp(imageBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        });

      let thumbnailBuffer;
      let mimeType;

      switch (format) {
        case 'webp':
          thumbnailBuffer = await sharpInstance.webp({ quality }).toBuffer();
          mimeType = 'image/webp';
          break;
        case 'jpeg':
        case 'jpg':
          thumbnailBuffer = await sharpInstance.jpeg({ quality }).toBuffer();
          mimeType = 'image/jpeg';
          break;
        case 'png':
          thumbnailBuffer = await sharpInstance.png({ compressionLevel: 6 }).toBuffer();
          mimeType = 'image/png';
          break;
        default:
          thumbnailBuffer = await sharpInstance.webp({ quality }).toBuffer();
          mimeType = 'image/webp';
      }

      return {
        buffer: thumbnailBuffer,
        mimeType,
        size: thumbnailBuffer.length,
        dimensions: { width, height }
      };

    } catch (error) {
      console.error('Thumbnail creation error:', error);
      throw new ApiError(
        `Thumbnail creation failed: ${error.message}`,
        'THUMBNAIL_CREATION_ERROR',
        500
      );
    }
  }

  /**
   * Generate multiple image variants (original, compressed, thumbnail)
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {string} originalMimeType - Original image mime type
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Multiple image variants
   */
  async generateImageVariants(imageBuffer, originalMimeType, options = {}) {
    try {
      const {
        createThumbnail = true,
        thumbnailSize = { width: 300, height: 300 },
        compressOriginal = true
      } = options;

      // Handle SVG files differently - they don't need variants
      if (originalMimeType === 'image/svg+xml') {
        const variants = {};
        
        // For SVG files, we just return the original as compressed
        if (compressOriginal) {
          variants.compressed = {
            buffer: imageBuffer,
            mimeType: originalMimeType,
            extension: 'svg',
            size: imageBuffer.length,
            originalDimensions: null // SVG files are scalable
          };
        }

        // Keep original if requested
        if (options.keepOriginal) {
          variants.original = {
            buffer: imageBuffer,
            mimeType: originalMimeType,
            size: imageBuffer.length,
            extension: 'svg'
          };
        }

        return variants;
      }

      const variants = {};

      // Original compressed version
      if (compressOriginal) {
        variants.compressed = await this.processImage(imageBuffer, originalMimeType, {
          convertToWebP: true,
          ...options
        });
      }

      // Thumbnail
      if (createThumbnail) {
        variants.thumbnail = await this.createThumbnail(imageBuffer, {
          ...thumbnailSize,
          format: 'webp',
          quality: 70
        });
      }

      // Keep original if requested
      if (options.keepOriginal) {
        variants.original = {
          buffer: imageBuffer,
          mimeType: originalMimeType,
          size: imageBuffer.length,
          extension: this.getExtensionFromMimeType(originalMimeType)
        };
      }

      return variants;

    } catch (error) {
      console.error('Image variants generation error:', error);
      throw new ApiError(
        `Image variants generation failed: ${error.message}`,
        'IMAGE_VARIANTS_ERROR',
        500
      );
    }
  }

  /**
   * Validate image constraints
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} mimeType - Image mime type
   * @param {Object} constraints - Validation constraints
   * @returns {Promise<boolean>}
   */
  async validateImageConstraints(imageBuffer, mimeType, constraints = {}) {
    try {
      const {
        maxWidth = 5000,
        maxHeight = 5000,
        minWidth = 10,
        minHeight = 10,
        maxFileSize = 50 * 1024 * 1024, // 50MB
        allowedFormats = this.supportedFormats
      } = constraints;

      // Check file size
      if (imageBuffer.length > maxFileSize) {
        throw new ApiError(
          `Image file size too large. Maximum allowed: ${maxFileSize / (1024 * 1024)}MB`,
          'IMAGE_TOO_LARGE',
          400
        );
      }

      // Handle SVG files differently - they don't have fixed dimensions
      if (mimeType === 'image/svg+xml') {
        // For SVG files, we only check file size and format
        // SVG files are scalable and don't have fixed dimensions
        return true;
      }

      // Get image metadata for raster images
      const metadata = await sharp(imageBuffer).metadata();

      // Check dimensions
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        throw new ApiError(
          `Image dimensions too large. Maximum: ${maxWidth}x${maxHeight}`,
          'IMAGE_DIMENSIONS_TOO_LARGE',
          400
        );
      }

      if (metadata.width < minWidth || metadata.height < minHeight) {
        throw new ApiError(
          `Image dimensions too small. Minimum: ${minWidth}x${minHeight}`,
          'IMAGE_DIMENSIONS_TOO_SMALL',
          400
        );
      }

      // Check format
      if (!allowedFormats.includes(metadata.format)) {
        throw new ApiError(
          `Unsupported image format: ${metadata.format}`,
          'UNSUPPORTED_IMAGE_FORMAT',
          400
        );
      }

      return true;

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Image validation failed: ${error.message}`,
        'IMAGE_VALIDATION_ERROR',
        400
      );
    }
  }
}

module.exports = new ImageProcessingService(); 