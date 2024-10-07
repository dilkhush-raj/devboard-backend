import bcrypt from "bcrypt";
import {User} from "../../models/user.model";
import sendEmail from "../../services/sendEmail";
import {ApiError} from "../../utils/ApiError";
import {ApiResponse} from "../../utils/ApiResponse";
import {asyncHandler} from "../../utils/asyncHandler";
import generateOTP from "../../utils/generateOTP";
import {welcomeEmail} from "../../services/welcomeEmail";

const createUser = asyncHandler(async (req, res) => {
  const {fullname, username, email, password} = req.body;

  // Validate required fields
  if ([fullname, username, email, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  // Validate password strength
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  // Normalize inputs
  const normalizedUsername = username.toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{username: normalizedUsername}, {email: normalizedEmail}],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      existingUser.username === normalizedUsername
        ? "Username already exists"
        : "Email already exists"
    );
  }

  // Generate OTP
  const otp = generateOTP();

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = await User.create({
    fullname: fullname.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashedPassword,
    otp,
  });

  // Retrieve created user
  const createdUser = await User.findById(newUser._id).select(
    "_id username fullname email roles permissions avatar"
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to retrieve created user");
  }

  // Send welcome email
  try {
    await sendEmail({
      from: process.env.EMAIL || "reply.devboard@gmail.com",
      to: normalizedEmail,
      subject: "Welcome to DevBoard! 🎉",
      html: welcomeEmail,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }

  // Send verification email
  try {
    await sendEmail({
      from: process.env.EMAIL || "reply.devboard@gmail.com",
      to: normalizedEmail,
      subject: "Verify Your Account",
      html: `<h1>Account Verification</h1><p>Your OTP is: ${otp}</p>`,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }

  // Return success response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export {createUser};
