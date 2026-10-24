import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import env from './env';

const s3ClientConfig: S3ClientConfig = {
  region: env.AWS_REGION || 'us-east-1',
};

if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  };
}

if (env.AWS_S3_ENDPOINT) {
  s3ClientConfig.endpoint = env.AWS_S3_ENDPOINT;
  s3ClientConfig.forcePathStyle = true;
}

export const s3 = new S3Client(s3ClientConfig);

export const isS3Configured = (): boolean => {
  return Boolean(env.AWS_S3_BUCKET && (
    (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) ||
    process.env.AWS_EXECUTION_ENV // running in AWS Lambda / ECS with IAM role
  ));
};

export default s3;
