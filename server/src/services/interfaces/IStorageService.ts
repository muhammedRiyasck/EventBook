export interface IStorageService {
  uploadImage(
    buffer: Buffer,
    originalname?: string,
    mimetype?: string,
    folder?: string
  ): Promise<string>;
  uploadMulterFile(
    file: Express.Multer.File,
    folder?: string
  ): Promise<string>;
  deleteImage(fileUrlOrKey: string): Promise<void>;
  uploadToS3(
    buffer: Buffer,
    originalname?: string,
    mimetype?: string,
    folder?: string
  ): Promise<string>;
  deleteFromS3(fileUrlOrKey: string): Promise<void>;
  uploadToCloudinary(buffer: Buffer, folder?: string): Promise<string>;
}
