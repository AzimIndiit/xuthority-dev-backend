const mongoose = require('mongoose');

const imageVariantSchema = new mongoose.Schema({
  url: { type: String, required: true },
  s3Key: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  dimensions: {
    width: { type: Number },
    height: { type: Number }
  }
}, { _id: false });

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  s3Key: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  
  // Media-specific fields
  isImage: { type: Boolean, default: false },
  isVideo: { type: Boolean, default: false },
  originalDimensions: {
    width: { type: Number },
    height: { type: Number }
  },
  
  // Video-specific metadata
  videoMetadata: {
    duration: { type: Number }, // in seconds
    fps: { type: Number },
    bitrate: { type: Number },
    format: { type: String },
    videoCodec: { type: String },
    audioCodec: { type: String },
    audioChannels: { type: Number },
    audioSampleRate: { type: Number }
  },
  
  // Media variants (compressed, thumbnail, etc.)
  variants: {
    compressed: imageVariantSchema,
    thumbnail: imageVariantSchema,
    original: imageVariantSchema,
    // Video quality variants
    high: imageVariantSchema,
    medium: imageVariantSchema,
    low: imageVariantSchema
  },
  
  // Processing metadata
  processingMetadata: {
    compressionRatio: { type: String },
    processedAt: { type: Date },
    processingTime: { type: Number }, // in milliseconds
    originalSize: { type: Number },
    error: { type: String }
  }
}, { timestamps: true });

// Index for efficient querying
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ mimeType: 1 });
fileSchema.index({ isImage: 1 });
fileSchema.index({ isVideo: 1 });

// Virtual for getting the best available media URL
fileSchema.virtual('bestMediaUrl').get(function() {
  if (this.isImage) {
    // Prefer compressed WebP version, fallback to original
    if (this.variants?.compressed?.url) {
      return this.variants.compressed.url;
    }
  } else if (this.isVideo) {
    // Prefer medium quality for videos, fallback to high, then original
    if (this.variants?.medium?.url) {
      return this.variants.medium.url;
    }
    if (this.variants?.high?.url) {
      return this.variants.high.url;
    }
  }
  
  return this.url;
});

// Virtual for getting the best available image URL (backward compatibility)
fileSchema.virtual('bestImageUrl').get(function() {
  if (!this.isImage) return this.url;
  return this.bestMediaUrl;
});

// Virtual for getting thumbnail URL
fileSchema.virtual('thumbnailUrl').get(function() {
  if (!this.isImage && !this.isVideo) return this.url;
  
  if (this.variants?.thumbnail?.url) {
    return this.variants.thumbnail.url;
  }
  
  return this.url;
});

// Virtual for getting video streaming URL
fileSchema.virtual('streamingUrl').get(function() {
  if (!this.isVideo) return null;
  
  // Return medium quality for streaming, fallback to available qualities
  if (this.variants?.medium?.url) {
    return this.variants.medium.url;
  }
  if (this.variants?.high?.url) {
    return this.variants.high.url;
  }
  if (this.variants?.low?.url) {
    return this.variants.low.url;
  }
  
  return this.url;
});

// Method to get file size in human readable format
fileSchema.methods.getHumanReadableSize = function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Method to check if file has been processed
fileSchema.methods.isProcessed = function() {
  if (this.isImage) {
    return this.variants?.compressed?.url;
  }
  if (this.isVideo) {
    return this.variants?.medium?.url || this.variants?.high?.url || this.variants?.low?.url;
  }
  return false;
};

// Method to get formatted duration for videos
fileSchema.methods.getFormattedDuration = function() {
  if (!this.isVideo || !this.videoMetadata?.duration) return null;
  
  const duration = this.videoMetadata.duration;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Method to get available video qualities
fileSchema.methods.getAvailableQualities = function() {
  if (!this.isVideo) return [];
  
  const qualities = [];
  if (this.variants?.high?.url) qualities.push('high');
  if (this.variants?.medium?.url) qualities.push('medium');
  if (this.variants?.low?.url) qualities.push('low');
  
  return qualities;
};

// Static method to find images only
fileSchema.statics.findImages = function(filter = {}) {
  return this.find({ ...filter, isImage: true });
};

// Static method to find videos only
fileSchema.statics.findVideos = function(filter = {}) {
  return this.find({ ...filter, isVideo: true });
};

// Static method to find media files (images and videos)
fileSchema.statics.findMedia = function(filter = {}) {
  return this.find({ 
    ...filter, 
    $or: [{ isImage: true }, { isVideo: true }] 
  });
};

// Ensure virtuals are included in JSON output
fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('File', fileSchema);
