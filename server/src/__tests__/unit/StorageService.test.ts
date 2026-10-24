import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../../services/StorageService';
import env from '../../config/env';
import { s3 } from '../../config/s3';

vi.mock('../../config/s3', () => ({
  s3: {
    send: vi.fn(),
  },
  isS3Configured: vi.fn(),
}));

vi.mock('../../config/cloudinary', () => ({
  default: {
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

describe('StorageService (Unit)', () => {
  let storageService: StorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    storageService = new StorageService();
  });

  describe('uploadToS3', () => {
    it('throws error if AWS_S3_BUCKET is not set', async () => {
      const originalBucket = env.AWS_S3_BUCKET;
      env.AWS_S3_BUCKET = '';

      const buffer = Buffer.from('fake-image-bytes');
      await expect(
        storageService.uploadToS3(buffer, 'test.jpg', 'image/jpeg', 'services')
      ).rejects.toThrow('AWS_S3_BUCKET is not configured');

      env.AWS_S3_BUCKET = originalBucket;
    });

    it('uploads buffer to S3 and returns standard S3 URL', async () => {
      env.AWS_S3_BUCKET = 'my-eventbook-bucket';
      env.AWS_REGION = 'ap-south-1';
      env.AWS_S3_CUSTOM_DOMAIN = '';
      env.AWS_S3_ENDPOINT = '';

      vi.mocked(s3.send).mockResolvedValueOnce({} as never);

      const buffer = Buffer.from('fake-image-bytes');
      const url = await storageService.uploadToS3(buffer, 'test image.png', 'image/png', 'services');

      expect(s3.send).toHaveBeenCalledTimes(1);
      expect(url).toMatch(/^https:\/\/my-eventbook-bucket\.s3\.ap-south-1\.amazonaws\.com\/services\/\d+-[a-f0-9]+-test_image\.png$/);
    });

    it('returns custom domain URL when AWS_S3_CUSTOM_DOMAIN is set', async () => {
      env.AWS_S3_BUCKET = 'my-eventbook-bucket';
      env.AWS_REGION = 'us-east-1';
      env.AWS_S3_CUSTOM_DOMAIN = 'https://cdn.eventbook.com';
      env.AWS_S3_ENDPOINT = '';

      vi.mocked(s3.send).mockResolvedValueOnce({} as never);

      const buffer = Buffer.from('fake-image-bytes');
      const url = await storageService.uploadToS3(buffer, 'sample.webp', 'image/webp', 'services');

      expect(url).toMatch(/^https:\/\/cdn\.eventbook\.com\/services\/\d+-[a-f0-9]+-sample\.webp$/);
      env.AWS_S3_CUSTOM_DOMAIN = '';
    });
  });

  describe('deleteFromS3', () => {
    it('extracts key from full S3 URL and deletes object', async () => {
      env.AWS_S3_BUCKET = 'my-eventbook-bucket';
      vi.mocked(s3.send).mockResolvedValueOnce({} as never);

      const s3Url = 'https://my-eventbook-bucket.s3.us-east-1.amazonaws.com/services/12345-photo.jpg';
      await storageService.deleteFromS3(s3Url);

      expect(s3.send).toHaveBeenCalledTimes(1);
    });
  });
});
