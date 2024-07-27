// @ts-nocheck
import {Question} from "../models/question.model";
import {asyncHandler} from "../utils/asyncHandler";
import {ApiError} from "../utils/ApiError";
import {ApiResponse} from "../utils/ApiResponse";

// Create question
const createQuestion = asyncHandler(async (req, res) => {
  // @ts-ignore
  const author = req.user?._id;
  const {title, content, tags} = req.body;

  // Check if any required fields are missing or empty
  if ([title, content, author].some((v) => !v || v.length === 0)) {
    throw new ApiError(400, "Missing required fields");
  }

  if (tags && !Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array");
  }

  const question = await Question.create({
    title: title,
    content: content,
    author: author,
    tags: tags || [],
  });

  const createdQuestion = await Question.findById(question._id)
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate("tags")
    .lean();

  if (!createdQuestion) {
    throw new ApiError(500, "Failed to create question");
  }

  return res.status(201).json(new ApiResponse(201, createdQuestion));
});

// Get all questions sorted by created_at and paginate
const getAllQuestions = asyncHandler(async (req, res) => {
  // sort = "created_at" | "-created_at" | "title" | "-title"
  const {page = 1, limit = 10, sort} = req.query;

  // Determine sort field and order
  let sortField = "created_at"; // default sort field
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
  const totalCount = await Question.countDocuments();

  // Retrieve questions with sorting and pagination
  const questions = await Question.find()
    .sort({[sortField]: sortOrder})
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: " -createdAt -__v"})
    .lean();

  return res.status(200).json(new ApiResponse(200, {totalCount, questions}));
});

// Search questions
const searchQuestions = asyncHandler(async (req, res) => {
  const {q, limit = 5, page = 1} = req.query;

  if (!q) {
    throw new ApiError(400, "Missing search term");
  }

  const findQuestion = async (q) => {
    if (typeof q !== "string" || q.trim() === "") {
      throw new Error("Search query must be a non-empty string");
    }

    try {
      // Optimize regex for partial and exact match
      const regex = new RegExp(`.*${q}.*`, "i"); // 'i' for case-insensitive search

      // Full-text search with optimized query
      const results = await Question.find({
        $or: [{title: regex}, {content: regex}],
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({path: "author", select: "_id fullname username avatar"})
        .populate({path: "tags", select: "-createdAt -__v"})
        .lean();

      return results;
    } catch (error) {
      console.error("Error searching questions:", error);
      throw new Error("Error occurred while searching questions");
    }
  };

  const results = await findQuestion(q);

  return res.status(200).json(new ApiResponse(200, results));
});

// Delete question
const deleteQuestion = asyncHandler(async (req, res) => {
  const {id} = req.params;

  if (!id) {
    throw new ApiError(400, "Missing question id");
  }

  const question = await Question.findById(id);

  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  await Question.deleteOne({_id: id});

  return res.status(204).json(new ApiResponse(204, "Question deleted"));
});

// Update question
const updateQuestion = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) {
    throw new ApiError(400, "Missing question id");
  }
  const {title, content, tags} = req.body;

  if (!title && !content && !tags) {
    throw new ApiError(400, "Missing title or content");
  }

  if (tags && !Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array");
  }

  const question = await Question.findById(id);

  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  const updatedQuestion = await Question.findOneAndUpdate(
    {_id: id},
    {$set: {title, content, tags}},
    {new: true}
  );

  return res.status(200).json(new ApiResponse(200, updatedQuestion));
});

// Get question by id
const getQuestionById = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) {
    throw new ApiError(400, "Missing question id");
  }
  const question = await Question.findById(id)
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: "-createdAt -__v"})
    .lean();

  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  return res.status(200).json(new ApiResponse(200, question));
});

const getQuestionsByAuthorId = asyncHandler(async (req, res) => {
  const {author, username, limit = 5, page = 1, sort} = req.query;

  if (!author && !username) {
    throw new ApiError(400, "Missing authorId or username");
  }

  // Determine sort field and order
  let sortField = "created_at"; // default sort field
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

  const query = {};
  if (author) query.author = author;
  if (username) query.author = username;

  // find all questions with the given author or username
  const questions = await Question.find(query)
    .sort({[sortField]: sortOrder})
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: "-createdAt -__v"})
    .lean();

  return res.status(200).json(new ApiResponse(200, questions));
});

// Get question by slug
const getQuestionBySlug = asyncHandler(async (req, res) => {
  const {slug} = req.params;
  if (!slug) {
    throw new ApiError(400, "Missing slug");
  }
  const question = await Question.findOne({slug: slug})
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: "-createdAt -__v"})
    .lean();

  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  return res.status(200).json(new ApiResponse(200, question));
});

export {
  createQuestion,
  getAllQuestions,
  searchQuestions,
  deleteQuestion,
  updateQuestion,
  getQuestionById,
  getQuestionsByAuthorId,
  getQuestionBySlug,
};
