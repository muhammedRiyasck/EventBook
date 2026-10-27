import crypto from 'crypto';
import path from 'path';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3, isS3Configured } from '../../config/s3';
import env from '../../config/env';
import { IStorageProvider } from './IStorageProvider';

export class S3StorageProvider implements IStorageProvider {
  readonly name = 's3';

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

  isAvailable(): boolean {
    return isS3Configured();
  }

  canHandle(fileUrlOrKey: string): boolean {
    if (!fileUrlOrKey) return false;
    return (
      fileUrlOrKey.includes('.amazonaws.com') ||
      Boolean(env.AWS_S3_CUSTOM_DOMAIN && fileUrlOrKey.startsWith(env.AWS_S3_CUSTOM_DOMAIN)) ||
      Boolean(env.AWS_S3_ENDPOINT && fileUrlOrKey.startsWith(env.AWS_S3_ENDPOINT)) ||
      !fileUrlOrKey.startsWith('http')
    );
  }

  async upload(
    buffer: Buffer,
    originalname: string = 'image.jpg',
    mimetype: string = 'image/jpeg',
    folder: string = 'services'
  ): Promise<string> {
    if (!env.AWS_S3_BUCKET) {
      throw new Error('AWS_S3_BUCKET is not configured in environment variables');
    }

    const ext = path.extname(originalname) || this.getExtensionFromMime(mimetype);
    const safeBase =
      path
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

    if (env.AWS_S3_CUSTOM_DOMAIN) {
      const domain = env.AWS_S3_CUSTOM_DOMAIN.replace(/\/+$/, '');
      return `${domain}/${key}`;
    }

    if (env.AWS_S3_ENDPOINT) {
      const endpoint = env.AWS_S3_ENDPOINT.replace(/\/+$/, '');
      return `${endpoint}/${env.AWS_S3_BUCKET}/${key}`;
    }

    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async delete(fileUrlOrKey: string): Promise<void> {
    if (!env.AWS_S3_BUCKET) return;

    let key = fileUrlOrKey;
    if (fileUrlOrKey.startsWith('http://') || fileUrlOrKey.startsWith('https://')) {
      try {
        const parsed = new URL(fileUrlOrKey);
        key = parsed.pathname.replace(/^\/+/, '');
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
}
