const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const ApiError = require('../utils/apiError');

/**
 * Video Processing Service
 * Handles video compression, thumbnail generation, and metadata extraction
 */
class VideoProcessingService {
  constructor() {
    this.supportedFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'mpeg', 'mpg', '3gp'];
    this.outputFormat = 'mp4';
    this.compressionPresets = {
      high: {
        videoBitrate: '2000k',
        audioBitrate: '128k',
        videoCodec: 'libx264',
        audioCodec: 'aac',
        quality: 'high'
      },
      medium: {
        videoBitrate: '1000k',
        audioBitrate: '96k',
        videoCodec: 'libx264',
        audioCodec: 'aac',
        quality: 'medium'
      },
      low: {
        videoBitrate: '500k',
        audioBitrate: '64k',
        videoCodec: 'libx264',
        audioCodec: 'aac',
        quality: 'low'
      }
    };
    this.maxDuration = 600; // 10 minutes in seconds
    this.maxFileSize = 500 * 1024 * 1024; // 500MB
  }

  /**
   * Check if file is a video
   * @param {string} mimeType - File mime type
   * @returns {boolean}
   */
  isVideo(mimeType) {
    return mimeType && mimeType.startsWith('video/');
  }

  /**
   * Get video metadata
   * @param {Buffer} videoBuffer - Video buffer
   * @returns {Promise<Object>} Video metadata
   */
  async getVideoMetadata(videoBuffer) {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(__dirname, '../../temp', `temp_${Date.now()}.mp4`);
      
      try {
        // Ensure temp directory exists
        const tempDir = path.dirname(tempPath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Write buffer to temp file
        fs.writeFileSync(tempPath, videoBuffer);

        ffmpeg.ffprobe(tempPath, (err, metadata) => {
          // Clean up temp file
          try {
            fs.unlinkSync(tempPath);
          } catch (cleanupError) {
            console.warn('Failed to clean up temp file:', cleanupError);
          }

          if (err) {
            reject(new ApiError(`Failed to get video metadata: ${err.message}`, 'VIDEO_METADATA_ERROR', 400));
            return;
          }

          const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
          const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

          resolve({
            duration: parseFloat(metadata.format.duration) || 0,
            size: parseInt(metadata.format.size) || videoBuffer.length,
            bitrate: parseInt(metadata.format.bit_rate) || 0,
            format: metadata.format.format_name,
            video: videoStream ? {
              codec: videoStream.codec_name,
              width: videoStream.width,
              height: videoStream.height,
              fps: this.parseFPS(videoStream.r_frame_rate),
              bitrate: parseInt(videoStream.bit_rate) || 0
            } : null,
            audio: audioStream ? {
              codec: audioStream.codec_name,
              sampleRate: parseInt(audioStream.sample_rate) || 0,
              channels: audioStream.channels,
              bitrate: parseInt(audioStream.bit_rate) || 0
            } : null
          });
        });
      } catch (error) {
        // Clean up temp file on error
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        } catch (cleanupError) {
          console.warn('Failed to clean up temp file on error:', cleanupError);
        }
        reject(new ApiError(`Failed to process video: ${error.message}`, 'VIDEO_PROCESSING_ERROR', 500));
      }
    });
  }

  /**
   * Parse frame rate from FFmpeg format
   * @param {string} frameRate - Frame rate string (e.g., "30/1")
   * @returns {number} Frame rate as number
   */
  parseFPS(frameRate) {
    if (!frameRate) return 0;
    const parts = frameRate.split('/');
    if (parts.length === 2) {
      return parseFloat(parts[0]) / parseFloat(parts[1]);
    }
    return parseFloat(frameRate);
  }

  /**
   * Validate video constraints
   * @param {Buffer} videoBuffer - Video buffer
   * @param {Object} constraints - Validation constraints
   * @returns {Promise<Object>} Validation result with metadata
   */
  async validateVideoConstraints(videoBuffer, constraints = {}) {
    try {
      const {
        maxDuration = this.maxDuration,
        maxFileSize = this.maxFileSize,
        allowedFormats = this.supportedFormats
      } = constraints;

      // Check file size
      if (videoBuffer.length > maxFileSize) {
        throw new ApiError(
          `Video file size too large. Maximum allowed: ${maxFileSize / (1024 * 1024)}MB`,
          'VIDEO_TOO_LARGE',
          413
        );
      }

      // Get video metadata
      const metadata = await this.getVideoMetadata(videoBuffer);

      // Check duration
      if (metadata.duration > maxDuration) {
        throw new ApiError(
          `Video duration too long. Maximum allowed: ${maxDuration} seconds`,
          'VIDEO_DURATION_TOO_LONG',
          400
        );
      }

      // Check format
      const formatSupported = allowedFormats.some(format => 
        metadata.format.includes(format)
      );

      if (!formatSupported) {
        throw new ApiError(
          `Unsupported video format: ${metadata.format}`,
          'UNSUPPORTED_VIDEO_FORMAT',
          400
        );
      }

      return { valid: true, metadata };

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Video validation failed: ${error.message}`,
        'VIDEO_VALIDATION_ERROR',
        400
      );
    }
  }

  /**
   * Compress video
   * @param {Buffer} videoBuffer - Original video buffer
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} Compressed video data
   */
  async compressVideo(videoBuffer, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        quality = 'medium',
        maxWidth = 1280,
        maxHeight = 720
      } = options;

      const preset = this.compressionPresets[quality] || this.compressionPresets.medium;
      const inputPath = path.join(__dirname, '../../temp', `input_${Date.now()}.mp4`);
      const outputPath = path.join(__dirname, '../../temp', `output_${Date.now()}.mp4`);

      try {
        // Ensure temp directory exists
        const tempDir = path.dirname(inputPath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Write buffer to temp file
        fs.writeFileSync(inputPath, videoBuffer);

        const processingStartTime = Date.now();

        ffmpeg(inputPath)
          .videoCodec(preset.videoCodec)
          .audioCodec(preset.audioCodec)
          .videoBitrate(preset.videoBitrate)
          .audioBitrate(preset.audioBitrate)
          .size(`${maxWidth}x${maxHeight}`)
          .autopad()
          .format(this.outputFormat)
          .on('progress', (progress) => {
            console.log(`Video compression progress: ${progress.percent}%`);
          })
          .on('error', (err) => {
            // Clean up temp files
            this.cleanupTempFiles([inputPath, outputPath]);
            reject(new ApiError(`Video compression failed: ${err.message}`, 'VIDEO_COMPRESSION_ERROR', 500));
          })
          .on('end', () => {
            try {
              const compressedBuffer = fs.readFileSync(outputPath);
              const processingTime = Date.now() - processingStartTime;
              const compressionRatio = ((videoBuffer.length - compressedBuffer.length) / videoBuffer.length * 100).toFixed(2);

              // Clean up temp files
              this.cleanupTempFiles([inputPath, outputPath]);

              resolve({
                buffer: compressedBuffer,
                size: compressedBuffer.length,
                originalSize: videoBuffer.length,
                compressionRatio: `${compressionRatio}%`,
                processingTime,
                quality: preset.quality,
                format: this.outputFormat,
                mimeType: `video/${this.outputFormat}`
              });
            } catch (error) {
              this.cleanupTempFiles([inputPath, outputPath]);
              reject(new ApiError(`Failed to read compressed video: ${error.message}`, 'VIDEO_READ_ERROR', 500));
            }
          })
          .save(outputPath);

      } catch (error) {
        this.cleanupTempFiles([inputPath, outputPath]);
        reject(new ApiError(`Video compression setup failed: ${error.message}`, 'VIDEO_COMPRESSION_SETUP_ERROR', 500));
      }
    });
  }

  /**
   * Generate video thumbnail
   * @param {Buffer} videoBuffer - Video buffer
   * @param {Object} options - Thumbnail options
   * @returns {Promise<Object>} Thumbnail data
   */
  async generateVideoThumbnail(videoBuffer, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        width = 320,
        height = 240,
        timeOffset = '00:00:01',
        format = 'png'
      } = options;

      const inputPath = path.join(__dirname, '../../temp', `thumb_input_${Date.now()}.mp4`);
      const outputPath = path.join(__dirname, '../../temp', `thumb_output_${Date.now()}.${format}`);

      try {
        // Ensure temp directory exists
        const tempDir = path.dirname(inputPath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Write buffer to temp file
        fs.writeFileSync(inputPath, videoBuffer);

        ffmpeg(inputPath)
          .seekInput(timeOffset)
          .frames(1)
          .size(`${width}x${height}`)
          .format(format)
          .on('error', (err) => {
            this.cleanupTempFiles([inputPath, outputPath]);
            reject(new ApiError(`Thumbnail generation failed: ${err.message}`, 'THUMBNAIL_GENERATION_ERROR', 500));
          })
          .on('end', () => {
            try {
              const thumbnailBuffer = fs.readFileSync(outputPath);
              
              // Clean up temp files
              this.cleanupTempFiles([inputPath, outputPath]);

              resolve({
                buffer: thumbnailBuffer,
                size: thumbnailBuffer.length,
                mimeType: `image/${format}`,
                dimensions: { width, height },
                format
              });
            } catch (error) {
              this.cleanupTempFiles([inputPath, outputPath]);
              reject(new ApiError(`Failed to read thumbnail: ${error.message}`, 'THUMBNAIL_READ_ERROR', 500));
            }
          })
          .save(outputPath);

      } catch (error) {
        this.cleanupTempFiles([inputPath, outputPath]);
        reject(new ApiError(`Thumbnail generation setup failed: ${error.message}`, 'THUMBNAIL_SETUP_ERROR', 500));
      }
    });
  }

  /**
   * Generate multiple video variants
   * @param {Buffer} videoBuffer - Original video buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Multiple video variants
   */
  async generateVideoVariants(videoBuffer, options = {}) {
    try {
      const {
        createThumbnail = true,
        compressVideo = true,
        qualities = ['medium'],
        thumbnailOptions = {}
      } = options;

      const variants = {};
      const processingStartTime = Date.now();

      // Validate video first
      const validation = await this.validateVideoConstraints(videoBuffer);
      const metadata = validation.metadata;

      // Generate compressed versions
      if (compressVideo) {
        for (const quality of qualities) {
          try {
            const compressed = await this.compressVideo(videoBuffer, { quality });
            variants[quality] = compressed;
          } catch (error) {
            console.warn(`Failed to compress video in ${quality} quality:`, error.message);
          }
        }
      }

      // Generate thumbnail
      if (createThumbnail) {
        try {
          const thumbnail = await this.generateVideoThumbnail(videoBuffer, thumbnailOptions);
          variants.thumbnail = thumbnail;
        } catch (error) {
          console.warn('Failed to generate video thumbnail:', error.message);
        }
      }

      const totalProcessingTime = Date.now() - processingStartTime;

      return {
        variants,
        metadata,
        processingTime: totalProcessingTime,
        originalSize: videoBuffer.length
      };

    } catch (error) {
      console.error('Video variants generation error:', error);
      throw new ApiError(
        `Video variants generation failed: ${error.message}`,
        'VIDEO_VARIANTS_ERROR',
        500
      );
    }
  }

  /**
   * Clean up temporary files
   * @param {Array} filePaths - Array of file paths to clean up
   */
  cleanupTempFiles(filePaths) {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
      }
    });
  }

  /**
   * Get supported video formats
   * @returns {Array} Array of supported formats
   */
  getSupportedFormats() {
    return [...this.supportedFormats];
  }

  /**
   * Get compression presets
   * @returns {Object} Available compression presets
   */
  getCompressionPresets() {
    return { ...this.compressionPresets };
  }
}

module.exports = new VideoProcessingService(); 