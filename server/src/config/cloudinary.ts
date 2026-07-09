import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "igish2hr",
  api_key: process.env.CLOUDINARY_API_KEY || "726925978747979",
  api_secret: process.env.CLOUDINARY_API_SECRET || "nW447lBjlEA92y9VrPBNak0upjE",
});

export default cloudinary;
