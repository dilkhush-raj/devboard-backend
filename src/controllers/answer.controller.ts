// Answer controller
import {Request, Response} from "express";
import AnswerSchema from "../models/answer.model";
import {asyncHandler} from "../utils/asyncHandler";
import {ApiError} from "../utils/ApiError";
import {ApiResponse} from "../utils/ApiResponse";
import mongoose from "mongoose";
import {User} from "../models/user.model";

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
const createAnswer = asyncHandler(async (req, res) => {
  const {id} = req.params;
  const {content} = req.body;
  // @ts-ignore
  const author = req.user?._id;

  if (!author) {
    throw new ApiError(400, "User not logged in");
  }

  // Check if any required fields are missing or empty
  if ([id, content].some((v) => !v || v.length === 0)) {
    throw new ApiError(400, "Missing required fields");
  }

  const answer = await AnswerSchema.create({
    question: id,
    content: content,
    author: author,
  });

  const createdAnswer = await AnswerSchema.findById(answer._id)
    .populate({path: "author", select: "_id fullname username avatar"})
    .lean();

  if (!createdAnswer) {
    throw new ApiError(500, "Failed to create answer");
  } else {
    await User.findByIdAndUpdate(author, {$inc: {credit: 10}});
  }

  return res.status(201).json(new ApiResponse(201, createdAnswer));
});

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
  const {id} = req.params; // answer id
  // @ts-ignore
  const author = req.user?._id;

  if (!id) {
    throw new ApiError(400, "Missing answer id");
  }

  const answer = await AnswerSchema.findById(id);

  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }

  if (
    new mongoose.Types.ObjectId(answer.author).equals(
      new mongoose.Types.ObjectId(author)
    )
  ) {
    const deletedAnswer = await AnswerSchema.findByIdAndDelete(id);
  } else {
    throw new ApiError(403, "You are not the author of this answer");
  }

  return res.status(204).json(new ApiResponse(204, "Answer deleted"));
});

// Update answer
const updateAnswer = asyncHandler(async (req: Request, res: Response) => {
  const {id} = req.params;
  // @ts-ignore
  const author = req.user?._id;

  if (!id) {
    throw new ApiError(400, "Missing answer id");
  }
  const {content} = req.body;

  if (!content) {
    throw new ApiError(400, "Missing content");
  }

  const answer = await AnswerSchema.findById(id);

  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }

  if (
    new mongoose.Types.ObjectId(answer.author).equals(
      new mongoose.Types.ObjectId(author)
    )
  ) {
    const updatedAnswer = await AnswerSchema.findOneAndUpdate(
      {_id: id},
      {$set: {content}},
      {new: true}
    );
  } else {
    throw new ApiError(403, "You are not the author of this answer");
  }

  return res.status(200).json(new ApiResponse(200, "answer updated"));
});

// Get answer by id
const getAnswerById = asyncHandler(async (req: Request, res: Response) => {
  const {id} = req.params;
  if (!id) {
    throw new ApiError(400, "Missing answer id");
  }
  const answer = await AnswerSchema.findById(id)
    .populate({path: "author", select: "_id fullname username avatar"})
    .lean();

  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }

  return res.status(200).json(new ApiResponse(200, answer));
});

// Get all answer by question id
const getAnswerByQuestionId = asyncHandler(async (req, res) => {
  const {id} = req.params;
  const {page = 1, limit = 10} = req.query;

  if (!id) {
    throw new ApiError(400, "Missing answer id");
  }

  // get total count of answers
  const totalAnswers = await AnswerSchema.countDocuments({question: id});

  // sort by most upvotes length to less upvotes
  const answer = await AnswerSchema.find({question: id})
    .sort({upvotes: -1})
    .populate({path: "author", select: "_id fullname username avatar"})
    // @ts-ignore
    .skip((page - 1) * limit)
    // @ts-ignore
    .limit(limit)
    .lean();

  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }
  // @ts-ignore
  const totalPages = Math.ceil(totalAnswers / limit);

  res.json({
    answer,
    // @ts-ignore
    currentPage: parseInt(page, 10),
    totalPages,
    totalAnswers,
  });
});

// Upvote answer
const upvoteAnswer = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) {
    throw new ApiError(400, "Missing answer id");
  }

  const answer = await AnswerSchema.findById(id);

  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }
  // @ts-ignore
  const user = req.user?._id;

  if (!user) {
    throw new ApiError(400, "User not logged in");
  }

  if (answer.upvotes.includes(user)) {
    // Remove the upvote
    const updatedAnswer = await AnswerSchema.findByIdAndUpdate(
      id,
      {
        $pull: {upvotes: user},
      },
      {new: true}
    );
    return res.status(200).json(new ApiResponse(200, updatedAnswer));
  }

  const UpdatedAnswer = await AnswerSchema.findByIdAndUpdate(id, {
    $push: {upvotes: user},
    $pull: {downvotes: user},
  });
  return res.status(200).json(new ApiResponse(200, UpdatedAnswer));
});

// Downvote answer
const downvoteAnswer = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) {
    throw new ApiError(400, "Missing answer id");
  }
  const answer = await AnswerSchema.findById(id);
  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }

  // @ts-ignore
  const user = req.user?._id;
  if (!user) {
    throw new ApiError(400, "User not logged in");
  }

  if (answer.downvotes.includes(user)) {
    // Remove the upvote
    const updatedAnswer = await AnswerSchema.findByIdAndUpdate(
      id,
      {
        $pull: {downvotes: user},
      },
      {new: true}
    );
    return res.status(200).json(new ApiResponse(200, {}, "Downvoted"));
  }

  const UpdatedAnswer = await AnswerSchema.findByIdAndUpdate(id, {
    $push: {downvotes: user},
    $pull: {upvotes: user},
  });

  return res.status(200).json(new ApiResponse(200, UpdatedAnswer));
});

// Get answer by user id
const getAnswerByUserId = asyncHandler(async (req, res) => {
  const {id} = req.params;
  const {page = 1, limit = 10} = req.query;
  if (!id) {
    throw new ApiError(400, "Missing user id");
  }
  const answer = await AnswerSchema.find({author: id})
    .populate({path: "author", select: "_id fullname username avatar"})
    // @ts-ignore
    .skip((page - 1) * limit)
    // @ts-ignore
    .limit(limit)
    .lean();

  // get total count of answers
  const totalAnswers = await AnswerSchema.countDocuments({author: id});

  if (!answer) {
    throw new ApiError(404, "Answer not found");
  }
  // @ts-ignore
  const totalPages = Math.ceil(totalAnswers / limit);

  res.json({
    answer,
    // @ts-ignore
    currentPage: parseInt(page, 10),
    totalPages,
    totalAnswers,
  });
});

export {
  createAnswer,
  getAnswerByQuestionId,
  upvoteAnswer,
  downvoteAnswer,
  getAllAnswers,
  searchAnswers,
  deleteAnswer,
  updateAnswer,
  getAnswerById,
  getAnswerByUserId,
};
