import {v2 as cloudinary, UploadApiResponse} from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (
  filePath: string,
  fileName: string,
  callback: (error: Error | null, result: UploadApiResponse | null) => void
) => {
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
    fs.unlinkSync(filePath);
    callback(error instanceof Error ? error : new Error(String(error)), null);
  }
};

export default uploadOnCloudinary;
