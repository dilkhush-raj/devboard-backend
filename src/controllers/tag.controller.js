import tagModel from "../models/tag.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";

// Register user
const createTag = asyncHandler(async (req, res) => {
  const {name, description} = req.body;

  // Check if any required fields are missing or empty
  if ([name, description].some((v) => !v || v.length === 0)) {
    throw new ApiError(400, "Missing required fields");
  }

  const existedTag = await tagModel.findOne({name});

  if (existedTag) {
    throw new ApiError(409, "Tag already exists");
  }

  const tag = await tagModel.create({
    name: name,
    description,
  });

  const createdTag = await tagModel.findById(tag._id);

  if (!createdTag) {
    throw new ApiError(500, "Failed to create tag");
  }

  return res.status(201).json(new ApiResponse(201, createdTag));
});

// Get all tags
const getAllTags = asyncHandler(async (req, res) => {
  const tags = await tagModel.find();
  return res.status(200).json(new ApiResponse(200, tags));
});

export {createTag, getAllTags};
