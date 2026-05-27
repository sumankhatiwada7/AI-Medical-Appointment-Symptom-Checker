import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from "cloudinary";
import "dotenv/config";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error("Missing Cloudinary configuration in environment variables.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string,
  resource_type: "image" | "auto"
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary upload failed"));
        }
        resolve(result as UploadApiResponse);
      }
    );

    stream.end(buffer);
  });
};
