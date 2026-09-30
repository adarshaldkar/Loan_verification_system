import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
});

// Image/PDF storage for evidence photos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lvms_evidence',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
  } as any,
});

// Audio storage for voice recordings (stored as raw)
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lvms_voice',
    resource_type: 'video', // Cloudinary uses 'video' for audio files too
    allowed_formats: ['mp3', 'webm', 'ogg', 'wav', 'm4a'],
  } as any,
});

export const upload = multer({ storage: storage });
export const uploadAudio = multer({ storage: audioStorage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit
export default cloudinary;
