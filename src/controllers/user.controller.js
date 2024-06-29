import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";

// Generate Access and Refresh Token

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    return {accessToken, refreshToken};
  } catch (error) {
    throw new ApiError(500, "Failed to generate access and refresh token");
  }
};

// Register user
const registerUser = asyncHandler(async (req, res) => {
  const {fullname, username, email, password} = req.body;

  // Check if any required fields are missing or empty
  if ([fullname, username, email, password].some((v) => !v || v.length === 0)) {
    throw new ApiError(400, "Missing required fields");
  }

  const existedUser = await User.findOne({
    $or: [{username}, {email}],
  });

  if (existedUser) {
    throw new ApiError(409, "Username or email already exists");
  }

  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to registeruser");
  }

  return res.status(201).json(new ApiResponse(201, createdUser));
});

// Login user
const loginUser = asyncHandler(async (req, res) => {
  const {username, password} = req.body;

  // Check if any required fields are missing or empty
  if (!username || !password) {
    throw new ApiError(400, "Missing required fields");
  }

  const user = await User.findOne({username});

  if (!user) {
    throw new ApiError(401, "Invalid username");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new ApiError(401, "Invalid password");
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findByIdAndUpdate(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  const {accessToken} = req.cookies;

  if (!accessToken) {
    throw new ApiError(401, "Access token not found");
  }

  const user = await User.findOne({accessToken});

  if (!user) {
    throw new ApiError(401, "Invalid access token");
  }

  await User.findByIdAndUpdate(user._id, {$set: {accessToken: null}});

  return res
    .status(200)
    .json(new ApiResponse(200, {user}, "User logged out successfully"));
});

// Get user by username or email or id
const getUser = asyncHandler(async (req, res) => {
  const {username, id, email} = req.query;

  if (!username && !id && !email) {
    throw new ApiError(400, "Missing required fields");
  }

  // Constructing the query object using $or operator
  const query = {
    $or: [
      ...(username ? [{username}] : []),
      ...(id ? [{_id: id}] : []),
      ...(email ? [{email}] : []),
    ],
  };

  const user = await User.findOne(query)
    .lean()
    .select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, user));
});

// Get list of all users with pagination
const getUsersList = asyncHandler(async (req, res) => {
  const {page = 1, limit = 5, sort, role} = req.query;

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

  if (role) {
    query.roles = {$in: [role]};
  }

  const totalRecords = await User.countDocuments(query);

  const users = await User.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({[sortField]: sortOrder})
    .lean()
    .select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, {totalRecords, users}));
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) {
    throw new ApiError(400, "Missing user id");
  }
  const {fullname, username, email, password} = req.body;

  if (!fullname && !username && !email && !password) {
    throw new ApiError(400, "Missing required fields");
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (fullname) {
    user.fullname = fullname;
  }

  if (username) {
    user.username = username;
  }

  if (email) {
    user.email = email;
  }

  if (password) {
    user.password = password;
  }

  const updatedUser = await User.findByIdAndUpdate(user._id, user);

  return res.status(200).json(new ApiResponse(200, updatedUser));
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) {
    throw new ApiError(400, "Missing user id");
  }
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await User.deleteOne({_id: id});
  return res.status(204).json(new ApiResponse(204, "User deleted"));
});

// Check if username is available
const checkUsernameAvailability = asyncHandler(async (req, res) => {
  const {username} = req.query;
  if (!username) {
    throw new ApiError(400, "Missing username");
  }

  const user = await User.findOne({username});

  if (user) {
    throw new ApiError(409, "Username already exists");
  }

  return res.status(200).json(new ApiResponse(200, "Username available"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  getUsersList,
  checkUsernameAvailability,
};
