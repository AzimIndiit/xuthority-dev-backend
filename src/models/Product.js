const mongoose = require("mongoose");
const slugify = require("slugify");

const PRODUCT_STATUS = [
  "pending",
  "approved",
  "rejected",
  "draft",
  "published",
  "archived",
];

const ACTIVE_STATUS = ["active", "inactive"];

// Main Product schema
const productSchema = new mongoose.Schema(
  {
    //Vendor information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // References to other collections (from old schema)
    softwareIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Software",
      },
    ],

    solutionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Solution",
      },
    ],

    // Basic product information
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // Website URL (from old schema)
    websiteUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty
          return /^https?:\/\/.+/.test(v);
        },
        message: "Website must be a valid URL",
      },
    },

    // Also support new website field for backward compatibility
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty
          return /^https?:\/\/.+/.test(v);
        },
        message: "Website must be a valid URL",
      },
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    // References to other collections
    whoCanUse: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserRole", // Updated to use new UserRole model
      },
    ],

    industries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Industry", // Updated to use new Industry model
      },
    ],

    integrations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Integration", // Updated to use new Integration model
      },
    ],

    languages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Language", // Updated to use new Language model
      },
    ],

    marketSegment: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MarketSegment", // Updated to use new MarketSegment model
      },
    ],

    // Brand colors (simplified from old schema)
    brandColors: {
      type: String,
      trim: true,
    },

    // Logo URL (from old schema)
    logoUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: "Logo URL must be a valid URL",
      },
    },

    // Media URLs (from old schema)
    mediaUrls: [
      {
        type: String,
        trim: true,
      },
    ],

    // Features (both old array and new structured)
    features: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    // Pricing (both old array and new structured)
    pricing: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    // Product pricing availability
    isFree: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Review metrics (from old schema)
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Rating distribution for review filtering
    ratingDistribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    },

    // Product metrics
    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Status (updated to include old values)
    status: {
      type: String,
      enum: PRODUCT_STATUS,
      default: "published",
      index: true,
    },

    // Active status (from old schema)
    isActive: {
      type: String,
      enum: ACTIVE_STATUS,
      default: "active",
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // SEO and metadata
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 60,
    },

    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160,
    },

    keywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Dates
    publishedAt: {
      type: Date,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// Virtual for favorites (from old schema)
productSchema.virtual("favorites", {
  ref: "Favorite", // Assuming you have a Favorite model
  localField: "_id",
  foreignField: "productId",
  justOne: true,
});

// Virtual for isFavorite (from old schema)
productSchema.virtual("isFavorite").get(function () {
  if (!this.favorites || !this.favorites.userId) return false;
  return true;
});

// Indexes for better query performance
productSchema.index({ userId: 1, status: 1 });
productSchema.index({ status: 1, isActive: 1, publishedAt: -1 });
productSchema.index({ industries: 1 });
productSchema.index({ marketSegment: 1 });
productSchema.index({ solutions: 1 });
productSchema.index({ software: 1 });
productSchema.index({ keywords: 1 });
productSchema.index({ totalReviews: -1 });
productSchema.index({ name: "text", description: "text", keywords: "text" });

// Pre-save middleware for slug generation (from old schema)
productSchema.pre("save", function (next) {
  // Generate slug from name
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }

  // Update lastUpdated
  this.lastUpdated = new Date();

  // Set publishedAt when status changes to published or approved
  if (
    this.isModified("status") &&
    (this.status === "published" || this.status === "approved") &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  next();
});

// Pre-update middleware for slug (from old schema)
productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update?.name) {
    update.slug = slugify(update.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }

  // Update lastUpdated
  if (update.$set) {
    update.$set.lastUpdated = new Date();
  } else {
    update.lastUpdated = new Date();
  }

  next();
});

// Static methods
productSchema.statics.findPublished = function () {
  return this.find({
    status: { $in: ["published", "approved"] },
    isActive: "active",
  })
    .populate("userId", "firstName lastName companyName email")
    .populate("industries", "name slug")
    .populate("languages", "name slug")
    .populate("integrations", "name image")
    .populate("marketSegment", "name slug")
    .populate("whoCanUse", "name slug");
};

productSchema.statics.findByVendor = function (vendorId) {
  return this.find({
    $or: [{ userId: vendorId }, { vendor: vendorId }],
  })
    .populate("userId", "firstName lastName companyName email")
    .populate("industries", "name slug")
    .populate("languages", "name slug")
    .populate("integrations", "name image")
    .populate("marketSegment", "name slug")
    .populate("whoCanUse", "name slug");
};

productSchema.statics.search = function (query, options = {}) {
  const {
    software,
    industries,
    marketSegment,
    solutions,
    page = 1,
    limit = 10,
    minRating,
    maxPrice,
    minPrice,
  } = options;

  let filter = {
    status: { $in: ["published", "approved"] },
    isActive: "active",
  };

  if (query) {
    filter.$text = { $search: query };
  }

  if (software) filter.software = software;
  if (industries && industries.length) filter.industries = { $in: industries };
  if (marketSegment && marketSegment.length)
    filter.marketSegment = { $in: marketSegment };
  if (solutions && solutions.length) filter.solutions = { $in: solutions };
  if (minRating) filter.avgRating = { $gte: minRating };

  // Price filtering would need to search within pricing array
  if (minPrice || maxPrice) {
    const priceFilter = {};
    if (minPrice) priceFilter.$gte = minPrice;
    if (maxPrice) priceFilter.$lte = maxPrice;
    filter["pricing.price"] = priceFilter;
  }

  return this.find(filter)
    .populate("userId", "firstName lastName companyName")
    .populate("industries", "name slug")
    .populate("languages", "name slug")
    .populate("integrations", "name image")
    .populate("marketSegment", "name slug")
    .populate("whoCanUse", "name slug")
    .sort(
      query
        ? { score: { $meta: "textScore" } }
        : { avgRating: -1, totalReviews: -1, publishedAt: -1 },
    )
    .skip((page - 1) * limit)
    .limit(limit);
};

// Instance methods
productSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

productSchema.methods.toggleLike = function () {
  this.likes = this.likes > 0 ? this.likes - 1 : this.likes + 1;
  return this.save();
};

productSchema.methods.updateRating = function (newRating) {
  // This method would be called when a review is added/updated
  // You would calculate the new average rating and total reviews
  this.totalReviews += 1;
  this.avgRating =
    (this.avgRating * (this.totalReviews - 1) + newRating) / this.totalReviews;
  return this.save();
};

productSchema.methods.addToFavorites = function (userId) {
  // This would create a favorite record
  // Implementation depends on your Favorite model structure
  return this;
};

module.exports = mongoose.model("Product", productSchema);
