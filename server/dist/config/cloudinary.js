"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAudio = exports.upload = void 0;
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    api_key: process.env.CLOUDINARY_API_KEY || 'demo',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
});
// Image/PDF storage for evidence photos
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'lvms_evidence',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    },
});
// Audio storage for voice recordings (stored as raw)
const audioStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'lvms_voice',
        resource_type: 'video', // Cloudinary uses 'video' for audio files too
        allowed_formats: ['mp3', 'webm', 'ogg', 'wav', 'm4a'],
    },
});
exports.upload = (0, multer_1.default)({ storage: storage });
exports.uploadAudio = (0, multer_1.default)({ storage: audioStorage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit
exports.default = cloudinary_1.v2;
