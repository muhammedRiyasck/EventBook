export interface IStorageProvider {
  readonly name: string;
  upload(
    buffer: Buffer,
    originalname?: string,
    mimetype?: string,
    folder?: string
  ): Promise<string>;
  delete(fileUrlOrKey: string): Promise<void>;
  canHandle(fileUrlOrKey: string): boolean;
  isAvailable(): boolean;
}
