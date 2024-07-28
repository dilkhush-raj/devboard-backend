import {v2 as cloudinary, UploadApiResponse} from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      upload_preset: "default",
    });
    fs.unlinkSync(filePath);
  } catch (error) {
    fs.unlinkSync(filePath);
  }
};

export const deleteFromCloudinary = async (public_id: string) => {
  try {
    if (public_id) {
      const res = await cloudinary.uploader.destroy(public_id);
      return res;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

export default uploadOnCloudinary;
