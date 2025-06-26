const { Blog, ResourceCategory, User } = require('../models');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * Create a new blog
 */
const createBlog = async (blogData, userId) => {
  try {
    // Check if resource category exists
    const resourceCategory = await ResourceCategory.findById(blogData.resourceCategoryId);
    if (!resourceCategory) {
      throw new ApiError('Resource category not found', 'RESOURCE_CATEGORY_NOT_FOUND', 404);
    }

    const blog = new Blog({
      ...blogData,
      createdBy: userId
    });
    await blog.save();

    return ApiResponse.success(blog, 'Blog created successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error creating blog', 'BLOG_CREATE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get all blogs with pagination and filtering
 */
const getAllBlogs = async (queryParams) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      tag,
      resourceCategoryId,
      authorName,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryParams;

    const filter = {};

    // Add status filter
    if (status) {
      filter.status = status;
    }

    // Add tag filter
    if (tag) {
      filter.tag = tag;
    }

    // Add category filter
    if (resourceCategoryId) {
      filter.resourceCategoryId = resourceCategoryId;
    }

    // Add author filter
    if (authorName) {
      filter.authorName = { $regex: authorName, $options: 'i' };
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const blogs = await Blog.find(filter)
      .populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'resourceCategoryId', select: 'name slug' }
      ])
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Blog.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return ApiResponse.success(
      blogs,
      'Blogs retrieved successfully',
      { pagination, total }
    );
  } catch (error) {
    throw new ApiError('Error retrieving blogs', 'BLOGS_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get active blogs
 */
const getActiveBlogs = async () => {
  try {
    const blogs = await Blog.find({ status: 'active' })
      .populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'resourceCategoryId', select: 'name slug' }
      ])
      .sort({ createdAt: -1 });

    return ApiResponse.success(blogs, 'Active blogs retrieved successfully');
  } catch (error) {
    throw new ApiError('Error retrieving active blogs', 'ACTIVE_BLOGS_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get blog by ID
 */
const getBlogById = async (blogId) => {
  try {
    const blog = await Blog.findById(blogId)
      .populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'resourceCategoryId', select: 'name slug' }
      ]);

    if (!blog) {
      throw new ApiError('Blog not found', 'BLOG_NOT_FOUND', 404);
    }

    return ApiResponse.success(blog, 'Blog retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error retrieving blog', 'BLOG_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get blog by slug
 */
const getBlogBySlug = async (slug) => {
  try {
    const blog = await Blog.findOne({ slug })
      .populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'resourceCategoryId', select: 'name slug' }
      ]);

    if (!blog) {
      throw new ApiError('Blog not found', 'BLOG_NOT_FOUND', 404);
    }

    return ApiResponse.success(blog, 'Blog retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error retrieving blog', 'BLOG_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get blogs by category
 */
const getBlogsByCategory = async (categoryId) => {
  try {
    const category = await ResourceCategory.findById(categoryId);
    if (!category) {
      throw new ApiError('Resource category not found', 'RESOURCE_CATEGORY_NOT_FOUND', 404);
    }

    const blogs = await Blog.find({ 
      resourceCategoryId: categoryId, 
      status: 'active' 
    })
      .populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'resourceCategoryId', select: 'name slug' }
      ])
      .sort({ createdAt: -1 });

    return ApiResponse.success(blogs, 'Blogs retrieved successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error retrieving blogs by category', 'BLOGS_BY_CATEGORY_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Get blogs by tag
 */
const getBlogsByTag = async (tag) => {
  try {
    const blogs = await Blog.find({ 
      tag, 
      status: 'active' 
    })
      .populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'resourceCategoryId', select: 'name slug' }
      ])
      .sort({ createdAt: -1 });

    return ApiResponse.success(blogs, 'Blogs retrieved successfully');
  } catch (error) {
    throw new ApiError('Error retrieving blogs by tag', 'BLOGS_BY_TAG_FETCH_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Update blog
 */
const updateBlog = async (blogId, updateData) => {
  try {
    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw new ApiError('Blog not found', 'BLOG_NOT_FOUND', 404);
    }

    // Check if resource category exists if being updated
    if (updateData.resourceCategoryId) {
      const resourceCategory = await ResourceCategory.findById(updateData.resourceCategoryId);
      if (!resourceCategory) {
        throw new ApiError('Resource category not found', 'RESOURCE_CATEGORY_NOT_FOUND', 404);
      }
    }

    // Update the blog object and save to trigger pre-save middleware
    Object.assign(blog, updateData);
    const updatedBlog = await blog.save();

    await updatedBlog.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'resourceCategoryId', select: 'name slug' }
    ]);

    return ApiResponse.success(updatedBlog, 'Blog updated successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error updating blog', 'BLOG_UPDATE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Toggle blog status
 */
const toggleBlogStatus = async (blogId) => {
  try {
    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw new ApiError('Blog not found', 'BLOG_NOT_FOUND', 404);
    }

    blog.status = blog.status === 'active' ? 'inactive' : 'active';
    await blog.save();

    await blog.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'resourceCategoryId', select: 'name slug' }
    ]);

    return ApiResponse.success(blog, `Blog status updated to ${blog.status}`);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error updating blog status', 'BLOG_STATUS_UPDATE_ERROR', 500, { originalError: error.message });
  }
};

/**
 * Delete blog
 */
const deleteBlog = async (blogId) => {
  try {
    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw new ApiError('Blog not found', 'BLOG_NOT_FOUND', 404);
    }

    await Blog.findByIdAndDelete(blogId);

    return ApiResponse.success(null, 'Blog deleted successfully');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error deleting blog', 'BLOG_DELETE_ERROR', 500, { originalError: error.message });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getActiveBlogs,
  getBlogById,
  getBlogBySlug,
  getBlogsByCategory,
  getBlogsByTag,
  updateBlog,
  toggleBlogStatus,
  deleteBlog
}; 