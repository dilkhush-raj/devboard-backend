// Answer controller
import {Request, Response} from "express";
import AnswerSchema from "../models/answer.model";
import {asyncHandler} from "../utils/asyncHandler";
import {ApiError} from "../utils/ApiError";
import {ApiResponse} from "../utils/ApiResponse";

// Define the types for the request bodies
interface CreateAnswerRequestBody {
  question: string;
  content: string;
  author: string;
  tags?: string[];
}

interface UpdateAnswerRequestBody {
  content?: string;
  tags?: string[];
}

interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
}

type SortOrder = 1 | -1;

// Create answer
const createAnswer = asyncHandler(
  async (req: Request<{}, {}, CreateAnswerRequestBody>, res: Response) => {
    const {question, content, author, tags} = req.body;

    // Check if any required fields are missing or empty
    if ([question, content, author].some((v) => !v || v.length === 0)) {
      throw new ApiError(400, "Missing required fields");
    }

    if (tags && !Array.isArray(tags)) {
      throw new ApiError(400, "Tags must be an array");
    }

    const answer = await AnswerSchema.create({
      question: question,
      content: content,
      author: author,
      tags: tags || [],
    });

    const createdAnswer = await AnswerSchema.findById(answer._id)
      .populate({path: "author", select: "_id fullname username avatar"})
      .populate("tags")
      .lean();

    if (!createdAnswer) {
      throw new ApiError(500, "Failed to create answer");
    }

    return res.status(201).json(new ApiResponse(201, createdAnswer));
  }
);

// Get all answers sorted by created_at and paginate
const getAllAnswers = asyncHandler(
  async (req: Request<{}, {}, {}, QueryParams>, res: Response) => {
    const {page = 1, limit = 10, sort} = req.query;

    // Determine sort field and order
    let sortField: string = "created_at"; // default sort field
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

    // Get total count of answers
    const totalCount = await AnswerSchema.countDocuments();

    // Retrieve answers with sorting and pagination
    const answers = await AnswerSchema.find()
      .sort({[sortField]: sortOrder}) // Ensure sort order is of type SortOrder
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({path: "author", select: "_id fullname username avatar"})
      .populate({path: "tags", select: " -createdAt -__v"})
      .lean();

    return res.status(200).json(new ApiResponse(200, {totalCount, answers}));
  }
);

// Search answers
const searchAnswers = asyncHandler(
  async (req: Request<{}, {}, {}, QueryParams>, res: Response) => {
    const {q, limit = 5, page = 1} = req.query;

    if (!q) {
      throw new ApiError(400, "Missing search term");
    }

    const findAnswer = async (query: string) => {
      if (typeof query !== "string" || query.trim() === "") {
        throw new Error("Search query must be a non-empty string");
      }

      try {
        // Optimize regex for partial and exact match
        const regex = new RegExp(`.*${query}.*`, "i"); // 'i' for case-insensitive search

        // Full-text search with optimized query
        const results = await AnswerSchema.find({
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
  }
);

// Delete answer
const deleteAnswer = asyncHandler(async (req: Request, res: Response) => {
  const {id} = req.params;

  if (!id) {
    throw new ApiError(400, "Missing answer id");
  }

  const answer = await AnswerSchema.findById(id);

  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }

  await AnswerSchema.deleteOne({_id: id});

  return res.status(204).json(new ApiResponse(204, "Answer deleted"));
});

// Update answer
const updateAnswer = asyncHandler(async (req: Request, res: Response) => {
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

  const answer = await AnswerSchema.findById(id);

  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }

  const updatedAnswer = await AnswerSchema.findOneAndUpdate(
    {_id: id},
    {$set: {content, tags}},
    {new: true}
  );

  return res.status(200).json(new ApiResponse(200, updatedAnswer));
});

// Get answer by id
const getAnswerById = asyncHandler(async (req: Request, res: Response) => {
  const {id} = req.params;
  if (!id) {
    throw new ApiError(400, "Missing answer id");
  }
  const answer = await AnswerSchema.findById(id)
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
