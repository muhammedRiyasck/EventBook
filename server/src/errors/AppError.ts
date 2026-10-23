/**
 * Base application error. All domain errors extend this class.
 * The global errorHandler middleware identifies these via instanceof
 * and maps statusCode → HTTP response automatically.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from bugs
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 — Bad Request */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

/** 401 — Unauthorized */
export class UnauthorizedError extends AppError {
  constructor(message = 'Not authorized') {
    super(message, 401);
  }
}

/** 403 — Forbidden */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

/** 404 — Not Found */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/** 409 — Conflict (e.g. duplicate bookings, already-cancelled) */
export class ConflictError extends AppError {
  public readonly meta?: Record<string, unknown>;

  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, 409);
    this.meta = meta;
  }
}

/** 429 — Too Many Requests (e.g. OTP cooldown) */
export class TooManyRequestsError extends AppError {
  public readonly meta?: Record<string, unknown>;

  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, 429);
    this.meta = meta;
  }
}

/** 503 — Service Unavailable (e.g. Stripe down) */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503);
  }
}
