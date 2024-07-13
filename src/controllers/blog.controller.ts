// Blog controller
import {asyncHandler} from "../utils/asyncHandler";
import {ApiError} from "../utils/ApiError";
import {ApiResponse} from "../utils/ApiResponse";
import {Blog} from "../models/blog.model";
import mongoose from "mongoose";
import {Request, Response} from "express";

interface CreateBlogBody {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  tags?: mongoose.Types.ObjectId[];
}
interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
}

interface Params {
  author: string;
}

interface UpdateBlogBody {
  title?: string;
  content?: string;
  author?: mongoose.Types.ObjectId;
  tags?: mongoose.Types.ObjectId[];
}

type SortOrder = 1 | -1;

// Create blog
const createBlog = async (
  req: Request<{}, {}, CreateBlogBody>,
  res: Response
) => {
  const {title, content, author, tags} = req.body;

  if ([title, content].some((v) => !v || v.length === 0) || !author) {
    throw new ApiError(400, "Missing required fields");
  }

  if (tags && !Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array");
  }

  const blog = await Blog.create({
    title,
    content,
    author,
    tags: tags || [],
  });

  const createdBlog = await Blog.findOne({_id: blog._id})
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: "-createdAt -__v "})
    .lean();

  if (!createdBlog) {
    throw new ApiError(500, "Failed to create blog");
  }

  return res.status(201).json(new ApiResponse(201, createdBlog));
};

// Get blog by id
const getBlogById = asyncHandler(async (req, res) => {
  const {id} = req.params;

  const blog = await Blog.findById(id)
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: "-createdAt -__v "})
    .lean();

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  return res.status(200).json(new ApiResponse(200, blog));
});

// Get all blogs
const getAllBlogs = asyncHandler(
  async (req: Request<{}, {}, {}, QueryParams>, res: Response) => {
    const {page = 1, limit = 10, sort} = req.query;

    // Determine sort field and order
    let sortField = "published_at"; // default sort field
    let sortOrder: SortOrder = -1; // default sort order (descending for latest)

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

    const blogs = await Blog.find()
      .sort({[sortField]: sortOrder})
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({path: "author", select: "_id fullname username avatar"})
      .populate({path: "tags", select: "-createdAt -__v "})
      .lean();

    return res.status(200).json(new ApiResponse(200, {totalCount, blogs}));
  }
);

// Delete blog by id
const deleteBlogById = asyncHandler(async (req, res) => {
  const {id} = req.params;

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
const searchBlog = asyncHandler(
  async (req: Request<{}, {}, {}, QueryParams>, res: Response) => {
    const {q, page = 1, limit = 5, sort} = req.query;

    if (!q) {
      throw new ApiError(400, "Missing search query");
    }

    // Determine sort field and order
    let sortField = "published_at"; // default sort field
    let sortOrder: SortOrder = -1; // default sort order (descending for latest)

    if (sort) {
      if (sort.startsWith("-")) {
        sortField = sort.substring(1);
        sortOrder = -1; // descending order
      } else {
        sortField = sort;
        sortOrder = 1; // ascending order
      }
    }

    const findBlog = async (q: string) => {
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
          .populate({path: "author", select: "_id fullname username avatar"})
          .populate({path: "tags", select: "-createdAt -__v "})
          .lean();

        return results;
      } catch (error) {
        console.error("Error searching questions:", error);
        throw new Error("Error occurred while searching questions");
      }
    };

    const results = await findBlog(q);

    return res.status(200).json(new ApiResponse(200, results));
  }
);

// Get blog by author
const getBlogByAuthor = async (
  req: Request<{author: string}, {}, {}, QueryParams>,
  res: Response
) => {
  const {author} = req.params;
  const {page = 1, limit = 5, sort} = req.query;

  if (!author) {
    throw new ApiError(400, "Missing author");
  }

  // Determine sort field and order
  let sortField = "published_at"; // default sort field
  let sortOrder: SortOrder = -1; // default sort order (descending for latest)

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
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: "-createdAt -__v "})
    .lean();

  return res.status(200).json(new ApiResponse(200, blog));
};

// Get blog by tag
const getBlogByTag = async (
  req: Request<{tag: string}, {}, {}, QueryParams>,
  res: Response
) => {
  const {tag} = req.params;
  const {page = 1, limit = 5, sort} = req.query;

  if (!tag) {
    throw new ApiError(400, "Missing tag");
  }

  // Determine sort field and order
  let sortField = "published_at"; // default sort field
  let sortOrder: SortOrder = -1; // default sort order (descending for latest)

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
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: "-createdAt -__v "})
    .lean();

  if (blog.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, "Blog not found", "Blog not found"));
  }

  return res.status(200).json(new ApiResponse(200, blog));
};

// Update blog
const updateBlog = async (
  req: Request<{id: string}, {}, UpdateBlogBody>,
  res: Response
) => {
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

  const updatedBlog = await Blog.findById(id)
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: "-createdAt -__v "})
    .lean();

  if (!updatedBlog) {
    throw new ApiError(404, "Blog not found");
  }

  return res.status(200).json(new ApiResponse(200, updatedBlog));
};

// Get blog by slug
const getBlogBySlug = asyncHandler(async (req: Request, res: Response) => {
  const {slug} = req.params;

  if (!slug) {
    throw new ApiError(400, "Missing slug");
  }

  const blog = await Blog.findOne({slug: slug})
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: "-createdAt -__v "})
    .lean();

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  return res.status(200).json(new ApiResponse(200, blog));
});

// Get blog by likes
const getBlogByLikes = asyncHandler(
  async (req: Request<{}, {}, {}, QueryParams>, res: Response) => {
    const {page = 1, limit = 5, sort} = req.query;

    // Determine sort field and order
    let sortField = "published_at"; // default sort field
    let sortOrder: SortOrder = -1; // default sort order (descending for latest)

    if (sort) {
      if (sort.startsWith("-")) {
        sortField = sort.substring(1);
        sortOrder = -1; // descending order
      } else {
        sortField = sort;
        sortOrder = 1; // ascending order
      }
    }

    const blog = await Blog.find({like: {$gt: 0}})
      .sort({[sortField]: sortOrder})
      .skip((page - 1) * limit)
      .limit(limit)
      .select("_id title like slug ")
      .lean();

    // sort blog by likes
    blog.sort((a, b) => b.like - a.like);

    return res.status(200).json(new ApiResponse(200, blog));
  }
);

// Get blog by dislikes
const getBlogByDislikes = asyncHandler(
  async (req: Request<{}, {}, {}, QueryParams>, res: Response) => {
    const {page = 1, limit = 5, sort} = req.query;

    // Determine sort field and order
    let sortField = "published_at"; // default sort field
    let sortOrder: SortOrder = -1; // default sort order (descending for latest)

    if (sort) {
      if (sort.startsWith("-")) {
        sortField = sort.substring(1);
        sortOrder = -1; // descending order
      } else {
        sortField = sort;
        sortOrder = 1; // ascending order
      }
    }

    const blog = await Blog.find({dislike: {$gt: 0}})
      .sort({[sortField]: sortOrder})
      .skip((page - 1) * limit)
      .limit(limit)
      .select("_id title slug ")
      .lean();

    // sort blog by dislikes
    blog.sort((a, b) => b.dislike - a.dislike);

    return res.status(200).json(new ApiResponse(200, blog));
  }
);

export {
  createBlog,
  getBlogById,
  getAllBlogs,
  deleteBlogById,
  searchBlog,
  getBlogByAuthor,
  getBlogByTag,
  updateBlog,
  getBlogBySlug,
  getBlogByLikes,
  getBlogByDislikes,
};
