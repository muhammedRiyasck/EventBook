import crypto from 'crypto';
import path from 'path';
import streamifier from 'streamifier';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3, isS3Configured } from '../config/s3';
import cloudinary from '../config/cloudinary';
import env from '../config/env';

export class StorageService {
  /**
   * Determine extension fallback from mimetype.
   */
  private getExtensionFromMime(mimetype: string): string {
    switch (mimetype) {
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/gif':
        return '.gif';
      case 'image/svg+xml':
        return '.svg';
      case 'image/jpeg':
      case 'image/jpg':
      default:
        return '.jpg';
    }
  }

  /**
   * Upload a buffer to AWS S3.
   */
  async uploadToS3(
    buffer: Buffer,
    originalname: string = 'image.jpg',
    mimetype: string = 'image/jpeg',
    folder: string = 'services'
  ): Promise<string> {
    if (!env.AWS_S3_BUCKET) {
      throw new Error('AWS_S3_BUCKET is not configured in environment variables');
    }

    const ext = path.extname(originalname) || this.getExtensionFromMime(mimetype);
    const safeBase = path
      .basename(originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40) || 'image';
    const uniqueId = crypto.randomBytes(6).toString('hex');
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const key = `${cleanFolder}/${Date.now()}-${uniqueId}-${safeBase}${ext}`;

    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await s3.send(command);

    // Return custom CDN domain if specified (e.g. CloudFront)
    if (env.AWS_S3_CUSTOM_DOMAIN) {
      const domain = env.AWS_S3_CUSTOM_DOMAIN.replace(/\/+$/, '');
      return `${domain}/${key}`;
    }

    // Return custom endpoint URL if specified (e.g. MinIO / LocalStack)
    if (env.AWS_S3_ENDPOINT) {
      const endpoint = env.AWS_S3_ENDPOINT.replace(/\/+$/, '');
      return `${endpoint}/${env.AWS_S3_BUCKET}/${key}`;
    }

    // Standard AWS S3 URL
    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Delete an object from AWS S3 using its key or full S3 URL.
   */
  async deleteFromS3(fileUrlOrKey: string): Promise<void> {
    if (!env.AWS_S3_BUCKET) return;

    let key = fileUrlOrKey;
    if (fileUrlOrKey.startsWith('http://') || fileUrlOrKey.startsWith('https://')) {
      try {
        const parsed = new URL(fileUrlOrKey);
        key = parsed.pathname.replace(/^\/+/, '');
        // If path begins with bucket name (path-style endpoint), strip bucket
        if (key.startsWith(`${env.AWS_S3_BUCKET}/`)) {
          key = key.replace(`${env.AWS_S3_BUCKET}/`, '');
        }
      } catch {
        key = fileUrlOrKey;
      }
    }

    const command = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });

    await s3.send(command);
  }

  /**
   * Safely delete an image from S3 or Cloudinary.
   * Silently skips external URLs like Unsplash.
   */
  async deleteImage(fileUrlOrKey: string): Promise<void> {
    if (!fileUrlOrKey) return;

    try {
      const isS3 =
        fileUrlOrKey.includes('.amazonaws.com') ||
        (env.AWS_S3_CUSTOM_DOMAIN && fileUrlOrKey.startsWith(env.AWS_S3_CUSTOM_DOMAIN)) ||
        (env.AWS_S3_ENDPOINT && fileUrlOrKey.startsWith(env.AWS_S3_ENDPOINT)) ||
        !fileUrlOrKey.startsWith('http');

      if (isS3) {
        await this.deleteFromS3(fileUrlOrKey);
        return;
      }

      if (fileUrlOrKey.includes('res.cloudinary.com')) {
        const parts = fileUrlOrKey.split('/upload/');
        if (parts.length > 1) {
          const publicIdWithExt = parts[1].replace(/^v\d+\//, '');
          const publicId =
            publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;
          await cloudinary.uploader.destroy(publicId);
        }
      }
    } catch (err) {
      console.warn(`[StorageService] Failed to delete image (${fileUrlOrKey}):`, err);
    }
  }

  /**
   * Upload a buffer to Cloudinary with a 25-second timeout.
   */
  async uploadToCloudinary(buffer: Buffer, folder: string = 'event-booking/services'): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Image upload to Cloudinary timed out (25s)'));
        }
      }, 25000);

      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (error || !result) return reject(error || new Error('Cloudinary upload failed'));
          resolve(result.secure_url);
        }
      );

      stream.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });

      streamifier.createReadStream(buffer).pipe(stream);
    });
  }

  /**
   * Main unified upload handler.
   * Prefers AWS S3 when configured; falls back to Cloudinary if S3 credentials are not set.
   */
  async uploadImage(
    buffer: Buffer,
    originalname: string = 'image.jpg',
    mimetype: string = 'image/jpeg',
    folder: string = 'services'
  ): Promise<string> {
    if (isS3Configured()) {
      return this.uploadToS3(buffer, originalname, mimetype, folder);
    }

    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      return this.uploadToCloudinary(buffer, `event-booking/${folder}`);
    }

    throw new Error(
      'Image upload failed: Neither AWS S3 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET) nor Cloudinary credentials are configured in .env'
    );
  }

  /**
   * Helper to upload an Express.Multer.File directly.
   */
  async uploadMulterFile(file: Express.Multer.File, folder: string = 'services'): Promise<string> {
    return this.uploadImage(file.buffer, file.originalname, file.mimetype, folder);
  }
}

export const storageService = new StorageService();
export default storageService;
