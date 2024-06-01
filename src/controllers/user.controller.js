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

const getUser = asyncHandler(async (req, res) => {
  const {username} = req.query;
  if (!username) {
    throw new ApiError(400, "Missing required fields");
  }
  console.log(username);

  const user = await User.findOne({username}).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, user));
  return res.status(200).json(new ApiResponse(200, "user"));
});

export {registerUser, loginUser, logoutUser, getUser};
