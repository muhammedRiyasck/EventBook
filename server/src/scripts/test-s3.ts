import storageService from '../services/StorageService';
import { isS3Configured } from '../config/s3';
import env from '../config/env';

async function testS3Connection() {
  console.log('--- Testing AWS S3 Connection ---');
  console.log('Region:', env.AWS_REGION);
  console.log('Bucket:', env.AWS_S3_BUCKET);
  console.log('Access Key ID:', env.AWS_ACCESS_KEY_ID ? `${env.AWS_ACCESS_KEY_ID.slice(0, 4)}...${env.AWS_ACCESS_KEY_ID.slice(-4)}` : 'MISSING');
  console.log('Is S3 configured:', isS3Configured());

  if (!isS3Configured()) {
    console.error('ERROR: S3 is not configured. Please ensure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET are set in server/.env');
    process.exit(1);
  }

  // 1x1 transparent PNG buffer
  const sampleBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  try {
    console.log('\nUploading test object to S3 bucket...');
    const url = await storageService.uploadToS3(
      sampleBuffer,
      's3-connectivity-test.png',
      'image/png',
      'connectivity-test'
    );
    console.log('Upload SUCCESSFUL!');
    console.log('Generated Object URL:', url);

    console.log('\nCleaning up test object...');
    await storageService.deleteFromS3(url);
    console.log('Cleanup SUCCESSFUL!');

    console.log('\n AWS S3 is fully configured and working properly!');
  } catch (error: any) {
    console.error('\n S3 Upload FAILED:');
    console.error('Error Code:', error.name || error.Code);
    console.error('Error Message:', error.message);
    if (error.$metadata) {
      console.error('HTTP Status:', error.$metadata.httpStatusCode);
    }
    process.exit(1);
  }
}

testS3Connection();
