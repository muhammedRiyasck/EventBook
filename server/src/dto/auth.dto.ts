/**
 * Data Transfer Objects (DTOs) for Auth domain.
 * These typed shapes are passed from routes → controllers → services,
 * replacing raw `req.body` destructuring inside business logic.
 */

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface ResendOtpDto {
  email: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

/** Shape returned to the client after successful auth */
export interface AuthResponseDto {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    phone?: string;
  };
}
