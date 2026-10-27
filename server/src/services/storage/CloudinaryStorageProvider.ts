import streamifier from 'streamifier';
import cloudinary from '../../config/cloudinary';
import env from '../../config/env';
import { IStorageProvider } from './IStorageProvider';

export class CloudinaryStorageProvider implements IStorageProvider {
  readonly name = 'cloudinary';

  isAvailable(): boolean {
    return Boolean(
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    );
  }

  canHandle(fileUrlOrKey: string): boolean {
    if (!fileUrlOrKey) return false;
    return fileUrlOrKey.includes('res.cloudinary.com');
  }

  async upload(
    buffer: Buffer,
    _originalname?: string,
    _mimetype?: string,
    folder: string = 'event-booking/services'
  ): Promise<string> {
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

  async delete(fileUrlOrKey: string): Promise<void> {
    if (!fileUrlOrKey || !this.canHandle(fileUrlOrKey)) return;

    const parts = fileUrlOrKey.split('/upload/');
    if (parts.length > 1) {
      const publicIdWithExt = parts[1].replace(/^v\d+\//, '');
      const publicId =
        publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;
      await cloudinary.uploader.destroy(publicId);
    }
  }
}
