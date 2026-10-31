// Profile picture ki upload handling (Multer).
// File disk par save nahi hoti, RAM (memory) mein aati hai, phir s3Service usay S3 par bhejti hai.
const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] };

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ALLOWED_TYPES[file.mimetype];

  // Mimetype aur extension dono sahi hone chahiye
  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    return cb(new AppError('Only JPG, PNG or WEBP images are allowed', 400));
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
});

// Form field ka naam: profileImage
const uploadProfileImage = upload.single('profileImage');

module.exports = { uploadProfileImage, MAX_FILE_SIZE };
