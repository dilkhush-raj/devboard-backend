// Blog controller
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {Blog} from "../models/blog.model.js";

// Create blog
const createBlog = asyncHandler(async (req, res) => {
  const {title, content, author, tags} = req.body;

  // Check if any required fields are missing or empty
  if ([title, content, author].some((v) => !v || v.length === 0)) {
    throw new ApiError(400, "Missing required fields");
  }

  if (tags && !Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array");
  }

  const blog = await Blog.create({
    title: title,
    content: content,
    author: author,
    tags: tags || [],
  });

  return res.status(201).json(new ApiResponse(201, blog));
});

// Get blog by id
const getBlogById = asyncHandler(async (req, res) => {
  const {id} = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  return res.status(200).json(new ApiResponse(200, blog));
});

// Get all blogs
const getAllBlogs = asyncHandler(async (req, res) => {
  const {page, limit, sort} = req.query;

  // Determine sort field and order
  let sortField = "published_at"; // default sort field
  let sortOrder = -1; // default sort order (descending for latest)

  if (sort) {
    if (sort.startsWith("-")) {
      sortField = sort.substring(1);
      sortOrder = -1; // descending order
    } else {
      sortField = sort;
      sortOrder = 1; // ascending order
    }
  }

  // Get total count of questions
  const totalCount = await Blog.countDocuments();

  const blogs = await Blog.find({})
    .sort({[sortField]: sortOrder})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.status(200).json(new ApiResponse(200, {totalCount, blogs}));
});

// Delete blog by id
const deleteBlogById = asyncHandler(async (req, res) => {
  const {id} = req.params;

  console.log(id);

  if (!id) {
    throw new ApiError(400, "Missing blog id");
  }

  const blog = await Blog.findByIdAndDelete(id);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  return res.status(204).json(new ApiResponse(204, "Blog deleted"));
});

// Search blog by title or id
const searchBlog = asyncHandler(async (req, res) => {
  const {q, page = 1, limit = 5, sort} = req.query;

  if (!q) {
    throw new ApiError(400, "Missing search query");
  }

  // Determine sort field and order
  let sortField = "published_at"; // default sort field
  let sortOrder = -1; // default sort order (descending for latest)

  if (sort) {
    if (sort.startsWith("-")) {
      sortField = sort.substring(1);
      sortOrder = -1; // descending order
    } else {
      sortField = sort;
      sortOrder = 1; // ascending order
    }
  }

  const findBlog = async (q) => {
    if (typeof q !== "string" || q.trim() === "") {
      throw new Error("Search query must be a non-empty string");
    }

    try {
      // Optimize regex for partial and exact match
      const regex = new RegExp(`.*${q}.*`, "i"); // 'i' for case-insensitive search

      // Full-text search with optimized query
      const results = await Blog.find({
        $or: [{title: regex}, {content: regex}],
      })
        .sort({[sortField]: sortOrder})
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return results;
    } catch (error) {
      console.error("Error searching questions:", error);
      throw new Error("Error occurred while searching questions");
    }
  };

  const results = await findBlog(q);

  return res.status(200).json(new ApiResponse(200, results));
});

// Get blog by author
const getBlogByAuthor = asyncHandler(async (req, res) => {
  const {author} = req.params;
  const {page = 1, limit = 5, sort} = req.query;

  if (!author) {
    throw new ApiError(400, "Missing author");
  }

  // Determine sort field and order
  let sortField = "published_at"; // default sort field
  let sortOrder = -1; // default sort order (descending for latest)

  if (sort) {
    if (sort.startsWith("-")) {
      sortField = sort.substring(1);
      sortOrder = -1; // descending order
    } else {
      sortField = sort;
      sortOrder = 1; // ascending order
    }
  }

  const blog = await Blog.find({author: author})
    .sort({[sortField]: sortOrder})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.status(200).json(new ApiResponse(200, blog));
});

// Get blog by tag
const getBlogByTag = asyncHandler(async (req, res) => {
  const {tag} = req.params;
  const {page = 1, limit = 5, sort} = req.query;

  if (!tag) {
    throw new ApiError(400, "Missing tag");
  }

  // Determine sort field and order
  let sortField = "published_at"; // default sort field
  let sortOrder = -1; // default sort order (descending for latest)

  if (sort) {
    if (sort.startsWith("-")) {
      sortField = sort.substring(1);
      sortOrder = -1; // descending order
    } else {
      sortField = sort;
      sortOrder = 1; // ascending order
    }
  }

  const blog = await Blog.find({tags: {$in: [tag]}})
    .sort({[sortField]: sortOrder})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  if (blog.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, "Blog not found", "Blog not found"));
  }

  return res.status(200).json(new ApiResponse(200, blog));
});

// Update blog
const updateBlog = asyncHandler(async (req, res) => {
  const {id} = req.params;
  const {title, content, author, tags} = req.body;

  if (!id) {
    throw new ApiError(400, "Missing blog id");
  }

  if (!title && !content && !author && !tags) {
    throw new ApiError(400, "Missing blog data");
  }

  const blog = await Blog.findByIdAndUpdate(id, {
    title: title,
    content: content,
    author: author,
    tags: tags || [],
  });

  const updatedBlog = await Blog.findById(id);

  if (!updatedBlog) {
    throw new ApiError(404, "Blog not found");
  }

  return res.status(200).json(new ApiResponse(200, updatedBlog));
});

export {
  createBlog,
  getBlogById,
  getAllBlogs,
  deleteBlogById,
  searchBlog,
  getBlogByAuthor,
  getBlogByTag,
  updateBlog,
};
