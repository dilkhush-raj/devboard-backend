import mongoose from "mongoose";
import {DB_NAME} from "../constants";

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    const err = new Error("No MONGODB_URI in env variable");
    console.log(err.message);
  }

  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

export default connectDB;
