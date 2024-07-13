// Saved controller
import {Request, Response} from "express";
import SavedSchema from "../models/saved.model";
import {asyncHandler} from "../utils/asyncHandler";
import {ApiError} from "../utils/ApiError";
import {ApiResponse} from "../utils/ApiResponse";

// Define the types for the request bodies
interface CreateSavedRequestBody {
  content: string;
  contentType: string;
}

interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
}

type SortOrder = 1 | -1;

// Create saved
const createSaved = asyncHandler(
  async (req: Request<{}, {}, CreateSavedRequestBody>, res: Response) => {
    // @ts-ignore
    const user = req.user?._id;

    const {content, contentType} = req.body;

    // Check if any required fields are missing or empty
    if (!content || !contentType) {
      throw new ApiError(400, "Missing required fields");
    }

    const saved = await SavedSchema.create({
      user: user,
      content: content,
      contentType: contentType,
    });

    const createdSaved = await SavedSchema.findById(saved._id)
      .populate({path: "user", select: "_id fullname username avatar"})
      .lean();

    if (!createdSaved) {
      throw new ApiError(500, "Failed to create saved");
    }

    return res.status(201).json(new ApiResponse(201, createdSaved));
  }
);

// Get all saved sorted by created_at and paginate
const getSaved = asyncHandler(
  async (req: Request<{}, {}, {}, QueryParams>, res: Response) => {
    const {page = 1, limit = 10, sort} = req.query;
    // @ts-ignore
    const user = req.user?._id;

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

    // Get total count of saved
    const totalCount = await SavedSchema.countDocuments();

    // Retrieve saved with sorting and pagination
    const saved = await SavedSchema.find({user: user})
      .sort({[sortField]: sortOrder}) // Ensure sort order is of type SortOrder
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "content",
        populate: {
          path: "author",
          model: "User",
        },
      })
      .lean();

    return res.status(200).json(new ApiResponse(200, {totalCount, saved}));
  }
);

// Delete saved
const deleteSaved = asyncHandler(async (req: Request, res: Response) => {
  const {id} = req.params;

  if (!id) {
    throw new ApiError(400, "Missing saved id");
  }

  const saved = await SavedSchema.findById(id);

  if (!saved) {
    throw new ApiError(404, "Saved not found");
  }

  await SavedSchema.deleteOne({_id: id});

  return res.status(204).json(new ApiResponse(204, "Saved deleted"));
});

export {createSaved, getSaved, deleteSaved};
