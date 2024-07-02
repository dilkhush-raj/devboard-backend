// @ts-nocheck
import tagModel from "../models/tag.model.ts";
import {asyncHandler} from "../utils/asyncHandler.ts";
import {ApiError} from "../utils/ApiError.ts";
import {ApiResponse} from "../utils/ApiResponse.ts";

// Create a new tag
const createTag = asyncHandler(async (req, res) => {
  const {name, description} = req.body;

  // Validate required fields
  if ([name, description].some((v) => !v || v.length === 0)) {
    throw new ApiError(400, "Missing required fields");
  }

  // Check if the tag already exists
  const existedTag = await tagModel.findOne({name});
  if (existedTag) {
    throw new ApiError(409, "Tag already exists");
  }

  // Create new tag
  const tag = await tagModel.create({name, description});
  const createdTag = await tagModel.findById(tag._id);

  // Ensure tag was created successfully
  if (!createdTag) {
    throw new ApiError(500, "Failed to create tag");
  }

  return res.status(201).json(new ApiResponse(201, createdTag));
});

// Retrieve all tags, sorted by name with pagination
const getAllTags = asyncHandler(async (req, res) => {
  const {page, limit} = req.query;

  // Validate pagination parameters
  if (!page || !limit) {
    throw new ApiError(400, "Missing page or limit");
  }

  // Get total count of tags
  const totalCount = await tagModel.countDocuments();

  // Retrieve tags with sorting and pagination
  const tags = await tagModel
    .find()
    .sort({name: 1})
    .skip((page - 1) * limit)
    .limit(limit);

  return res.status(200).json(new ApiResponse(200, {totalCount, tags}));
});

// Search tags by query with optional limit on results
const searchTags = asyncHandler(async (req, res) => {
  const {q, limit} = req.query;

  // Validate search term
  if (!q) {
    throw new ApiError(400, "Missing search term");
  }

  // Helper function to find tags based on search query
  const findTags = async (q) => {
    if (typeof q !== "string" || q.trim() === "") {
      throw new Error("Search query must be a non-empty string");
    }

    try {
      // Create regex for case-insensitive partial and exact match
      const regex = new RegExp(`.*${q}.*`, "i");

      // Perform search with regex and limit results
      const results = await tagModel
        .find({
          $or: [{name: regex}, {description: regex}],
        })
        .limit(limit || 10)
        .lean(); // Use lean() for better performance

      return results;
    } catch (error) {
      console.error("Error searching tags:", error);
      throw new Error("Error occurred while searching tags");
    }
  };

  const results = await findTags(q);

  return res.status(200).json(new ApiResponse(200, results));
});

// Delete a tag by ID
const deleteTag = asyncHandler(async (req, res) => {
  const {id} = req.params;

  // Validate tag ID
  if (!id) {
    throw new ApiError(400, "Missing tag id");
  }

  // Find tag by ID
  const tag = await tagModel.findById(id);
  if (!tag) {
    throw new ApiError(404, "Tag not found");
  }

  // Delete tag
  await tagModel.deleteOne({_id: id});

  return res.status(204).json(new ApiResponse(204, "Tag deleted"));
});

// Update a tag by ID
const updateTag = asyncHandler(async (req, res) => {
  const {id} = req.params;
  const {name, description} = req.body;

  // Validate tag ID and update data
  if (!id) {
    throw new ApiError(400, "Missing tag id");
  }
  if (!name && !description) {
    throw new ApiError(400, "Missing name or description");
  }

  // Find tag by ID
  const tag = await tagModel.findById(id);
  if (!tag) {
    throw new ApiError(404, "Tag not found");
  }

  // Update tag
  const updatedTag = await tagModel.findOneAndUpdate(
    {_id: id},
    {$set: {name, description}},
    {new: true} // Return the updated document
  );

  return res.status(200).json(new ApiResponse(200, updatedTag));
});

// Get a tag by ID
const getTagById = asyncHandler(async (req, res) => {
  const {id} = req.params;

  // Validate tag ID
  if (!id) {
    throw new ApiError(400, "Missing tag id");
  }

  // Find tag by ID
  const tag = await tagModel.findById(id);
  if (!tag) {
    throw new ApiError(404, "Tag not found");
  }

  return res.status(200).json(new ApiResponse(200, tag));
});

export {createTag, getAllTags, searchTags, deleteTag, updateTag, getTagById};
