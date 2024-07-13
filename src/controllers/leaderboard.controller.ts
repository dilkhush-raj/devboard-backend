// @ts-nocheck
import {User} from "../models/user.model";
import {ApiResponse} from "../utils/ApiResponse";
import {asyncHandler} from "../utils/asyncHandler";

const getLeaderboard = asyncHandler(async (req, res) => {
  const {page = 1, limit = 10, sort} = req.query;

  const totalRecords = await User.countDocuments();

  // get users and sort them by credit
  const data = await User.find()
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({credit: -1})
    .lean()
    .select("-password -refreshToken");

  const totalPages = Math.ceil(totalRecords / limit);

  res.json({
    data,
    currentPage: parseInt(page, 10),
    totalPages,
    totalRecords,
  });
});

export {getLeaderboard};
