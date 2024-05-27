import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_COLUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath, fileName, callback) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: fileName,
      resource_type: "auto",
      upload_preset: "default",
    });
    callback(null, result);
  } catch (error) {
    r;
    fs.unlinkSync(filePath);
    callback(error, null);
  }
};

export default uploadOnCloudinary;
