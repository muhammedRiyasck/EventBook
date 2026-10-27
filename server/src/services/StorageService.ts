import { IStorageProvider } from './storage/IStorageProvider';
import { S3StorageProvider } from './storage/S3StorageProvider';
import { CloudinaryStorageProvider } from './storage/CloudinaryStorageProvider';
import { IStorageService } from './interfaces/IStorageService';

/**
 * StorageService — unified storage façade adhering to:
 * - OCP: Open for extension (register new providers without modifying this class)
 * - LSP: Any IStorageProvider can substitute seamlessly
 * - SRP: Orchestrates providers while individual providers handle provider-specific SDK logic
 * - DIP: Services depend on IStorageService abstraction
 */
export class StorageService implements IStorageService {
  private providers: IStorageProvider[] = [];

  constructor(
    private readonly s3Provider: IStorageProvider = new S3StorageProvider(),
    private readonly cloudinaryProvider: IStorageProvider = new CloudinaryStorageProvider(),
    customProviders?: IStorageProvider[]
  ) {
    if (customProviders && customProviders.length > 0) {
      this.providers = customProviders;
    } else {
      this.providers = [this.s3Provider, this.cloudinaryProvider];
    }
  }

  /**
   * Register a new storage provider at runtime (OCP).
   */
  registerProvider(provider: IStorageProvider): void {
    this.providers.unshift(provider);
  }

  /**
   * Upload directly via AWS S3 provider.
   */
  async uploadToS3(
    buffer: Buffer,
    originalname: string = 'image.jpg',
    mimetype: string = 'image/jpeg',
    folder: string = 'services'
  ): Promise<string> {
    return this.s3Provider.upload(buffer, originalname, mimetype, folder);
  }

  /**
   * Delete directly via AWS S3 provider.
   */
  async deleteFromS3(fileUrlOrKey: string): Promise<void> {
    return this.s3Provider.delete(fileUrlOrKey);
  }

  /**
   * Upload directly via Cloudinary provider.
   */
  async uploadToCloudinary(
    buffer: Buffer,
    folder: string = 'event-booking/services'
  ): Promise<string> {
    return this.cloudinaryProvider.upload(buffer, undefined, undefined, folder);
  }

  /**
   * Unified image upload: selects first available provider (prefers S3, then Cloudinary).
   */
  async uploadImage(
    buffer: Buffer,
    originalname: string = 'image.jpg',
    mimetype: string = 'image/jpeg',
    folder: string = 'services'
  ): Promise<string> {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        const destFolder =
          provider.name === 'cloudinary' ? `event-booking/${folder}` : folder;
        return provider.upload(buffer, originalname, mimetype, destFolder);
      }
    }

    throw new Error(
      'Image upload failed: Neither AWS S3 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET) nor Cloudinary credentials are configured in .env'
    );
  }

  /**
   * Safely delete an image from whatever provider owns the file.
   */
  async deleteImage(fileUrlOrKey: string): Promise<void> {
    if (!fileUrlOrKey) return;

    try {
      for (const provider of this.providers) {
        if (provider.canHandle(fileUrlOrKey)) {
          await provider.delete(fileUrlOrKey);
          return;
        }
      }
    } catch (err) {
      console.warn(`[StorageService] Failed to delete image (${fileUrlOrKey}):`, err);
    }
  }

  /**
   * Helper to upload an Express.Multer.File directly.
   */
  async uploadMulterFile(
    file: Express.Multer.File,
    folder: string = 'services'
  ): Promise<string> {
    return this.uploadImage(file.buffer, file.originalname, file.mimetype, folder);
  }
}

export const storageService = new StorageService();
export default storageService;
