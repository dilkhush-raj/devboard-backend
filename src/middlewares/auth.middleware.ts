import jwt from "jsonwebtoken";
import {User} from "../models/user.model";
import {Request, Response, NextFunction} from "express";

const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  const token = req?.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Access token and refresh token are required",
    });
  }

  try {
    const decodedAccessToken = jwt.verify(
      token,
      // @ts-ignore
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedAccessToken.id);

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid access token",
      });
    }

    // @ts-ignore
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid access token",
    });
  }
};

export default verifyJWT;
