// Answer controller
import {Answer} from "../models/answer.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";

// Create answer
const createAnswer = asyncHandler(async (req, res) => {
  const {question, content, author, tags} = req.body;

  // Check if any required fields are missing or empty
  if ([question, content, author].some((v) => !v || v.length === 0)) {
    throw new ApiError(400, "Missing required fields");
  }

  if (tags && !Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array");
  }

  const answer = await Answer.create({
    question: question,
    content: content,
    author: author,
    tags: tags || [],
  });

  const createdAnswer = await Answer.findById(answer._id)
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate("tags")
    .lean();

  if (!createdAnswer) {
    throw new ApiError(500, "Failed to create answer");
  }

  return res.status(201).json(new ApiResponse(201, createdAnswer));
});

// Get all answers sorted by created_at and paginate
const getAllAnswers = asyncHandler(async (req, res) => {
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

  // Get total count of answers
  const totalCount = await Answer.countDocuments();

  // Retrieve answers with sorting and pagination
  const answers = await Answer.find()
    .sort({[sortField]: sortOrder})
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: " -createdAt -__v"})
    .lean();

  return res.status(200).json(new ApiResponse(200, {totalCount, answers}));
});

// Search answers
const searchAnswers = asyncHandler(async (req, res) => {
  const {q, limit = 5, page = 1} = req.query;

  if (!q) {
    throw new ApiError(400, "Missing search term");
  }

  const findAnswer = async (q) => {
    if (typeof q !== "string" || q.trim() === "") {
      throw new Error("Search query must be a non-empty string");
    }

    try {
      // Optimize regex for partial and exact match
      const regex = new RegExp(`.*${q}.*`, "i"); // 'i' for case-insensitive search

      // Full-text search with optimized query
      const results = await Answer.find({
        $or: [{content: regex}],
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({path: "author", select: "_id fullname username avatar"})
        .populate({path: "tags", select: "-createdAt -__v"})
        .lean();

      return results;
    } catch (error) {
      console.error("Error searching answers:", error);
      throw new Error("Error occurred while searching answers");
    }
  };

  const results = await findAnswer(q);

  return res.status(200).json(new ApiResponse(200, results));
});

// Delete answer
const deleteAnswer = asyncHandler(async (req, res) => {
  const {id} = req.params;

  if (!id) {
    throw new ApiError(400, "Missing answer id");
  }

  const answer = await Answer.findById(id);

  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }

  await Answer.deleteOne({_id: id});

  return res.status(204).json(new ApiResponse(204, "Answer deleted"));
});

// Update answer
const updateAnswer = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) {
    throw new ApiError(400, "Missing answer id");
  }
  const {content, tags} = req.body;

  if (!content && !tags) {
    throw new ApiError(400, "Missing content or tags");
  }

  if (tags && !Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be an array");
  }

  const answer = await Answer.findById(id);

  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }

  const updatedAnswer = await Answer.findOneAndUpdate(
    {_id: id},
    {$set: {content, tags}},
    {new: true}
  );

  return res.status(200).json(new ApiResponse(200, updatedAnswer));
});

// Get answer by id
const getAnswerById = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) {
    throw new ApiError(400, "Missing answer id");
  }
  const answer = await Answer.findById(id)
    .populate({path: "author", select: "_id fullname username avatar"})
    .populate({path: "tags", select: "-createdAt -__v"})
    .lean();

  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }

  return res.status(200).json(new ApiResponse(200, answer));
});

export {
  createAnswer,
  getAllAnswers,
  searchAnswers,
  deleteAnswer,
  updateAnswer,
  getAnswerById,
};
