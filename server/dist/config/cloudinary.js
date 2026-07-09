"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "igish2hr",
    api_key: process.env.CLOUDINARY_API_KEY || "726925978747979",
    api_secret: process.env.CLOUDINARY_API_SECRET || "nW447lBjlEA92y9VrPBNak0upjE",
});
exports.default = cloudinary_1.v2;
