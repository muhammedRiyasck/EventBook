import { Request, Response, NextFunction } from 'express';
import env from '../config/env';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
  path?: string;
  value?: string;
}

const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  if (err.name === 'MulterError') {
    statusCode = 400;
    const multerCode = (err as unknown as { code?: string }).code;
    if (multerCode === 'LIMIT_FILE_SIZE') {
      message = 'Image too large. Maximum file size allowed is 5MB per image.';
    } else if (multerCode === 'LIMIT_FILE_COUNT') {
      message = 'Too many images. Maximum allowed is 5 images.';
    } else if (multerCode === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected image upload or limit exceeded.';
    }
  }

  // Mongoose duplicate key error
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    statusCode = 400;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = `Invalid ID: ${err.value}`;
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Token expired, please log in again';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
