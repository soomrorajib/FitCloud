// AWS S3 par profile images upload/delete karne ka code.
// Image kabhi MongoDB mein nahi jati. MongoDB mein sirf URL aur key save hoti hai.
const crypto = require('crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const AppError = require('../utils/AppError');

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const isS3Configured = () =>
  ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'].every((name) => process.env[name]);

let s3Client = null;
const getClient = () => {
  if (!s3Client) {
    // Credentials .env se aate hain (SDK khud AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY padh leta hai).
    // EC2 par IAM Role laga ho to keys ki zaroorat hi nahi hoti.
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      // Optional: LocalStack / MinIO jaisa S3-compatible server local testing ke liye (production mein khali rakhein)
      ...(process.env.AWS_S3_ENDPOINT && { endpoint: process.env.AWS_S3_ENDPOINT, forcePathStyle: true }),
    });
  }
  return s3Client;
};

const publicUrlFor = (key) => {
  // CloudFront ya custom domain ho to AWS_S3_PUBLIC_URL mein daal sakte hain
  if (process.env.AWS_S3_PUBLIC_URL) return `${process.env.AWS_S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

// file = multer ki file (file.buffer mein image ka data hota hai)
const uploadProfileImage = async (file, userId) => {
  if (!isS3Configured()) {
    throw new AppError('Image upload is not configured on the server (AWS S3 settings missing)', 503);
  }

  const key = `profile-images/${userId}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${EXTENSIONS[file.mimetype]}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000',
    })
  );

  return { url: publicUrlFor(key), key };
};

// Delete fail ho jaye to request fail nahi karte, sirf log karte hain
const deleteFile = async (key) => {
  if (!key || !isS3Configured()) return;
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key }));
  } catch (error) {
    console.error('S3 delete failed:', error.message);
  }
};

module.exports = { uploadProfileImage, deleteFile, isS3Configured };
