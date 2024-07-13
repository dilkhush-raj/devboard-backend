import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

interface UserPayload {
  id: string;
  username: string;
  email: string;
  permissions: string[];
  roles: string[];
}

const userSchema = new mongoose.Schema(
  {
    username: {type: String, required: true, unique: true},
    fullname: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    bio: {type: String, default: ""},
    avatar: {type: String, default: ""},
    interests: [{type: mongoose.Schema.Types.ObjectId, ref: "Tag"}],
    permissions: {type: [String], default: []},
    roles: {type: [String], default: []},
    credit: {type: Number, default: 0},
    refreshToken: {type: String},
    verified: {type: Boolean, default: false},
  },
  {timestamps: true}
);

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

userSchema.methods.isPasswordCorrect = async function (
  password: string | Buffer
) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  const payload: UserPayload = {
    id: this._id,
    username: this.username,
    email: this.email,
    permissions: this.permissions,
    roles: this.roles,
  };

  return await jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

userSchema.methods.generateRefreshToken = function () {
  const payload: {id: string} = {
    id: this._id,
  };

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = mongoose.model("User", userSchema);
