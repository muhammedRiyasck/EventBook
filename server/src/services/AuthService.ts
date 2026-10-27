import jwt from 'jsonwebtoken';
import env from '../config/env';
import appEvents from '../utils/eventEmitter';
import userRepository from '../repositories/UserRepository';
import otpRepository from '../repositories/OtpRepository';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { IOtpRepository } from '../repositories/interfaces/IOtpRepository';
import {
  BadRequestError,
  ConflictError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../errors/AppError';
import { RegisterDto, LoginDto, AuthResponseDto } from '../dto/auth.dto';
import { IUser } from '../models/User';

/**
 * AuthService — all authentication business logic.
 */
export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository = userRepository,
    private readonly otpRepo: IOtpRepository = otpRepository
  ) {}

  private signToken(id: string): string {
    return jwt.sign({ id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  private formatUser(user: IUser): AuthResponseDto['user'] {
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };
  }

  /**
   * Initiate registration — saves OTP and fires email event.
   * Throws if the email is already registered.
   */
  async initiateRegistration(dto: RegisterDto): Promise<void> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpRepo.deleteByEmail(dto.email);
    await this.otpRepo.create({
      email: dto.email,
      otp,
      userData: { name: dto.name, password: dto.password, phone: dto.phone },
    });

    appEvents.emit('user.registered', { email: dto.email, otp });
  }

  /**
   * Verify OTP and create the user account.
   * Returns a signed token + user profile.
   */
  async verifyOtpAndRegister(email: string, otp: string): Promise<AuthResponseDto> {
    if (!email || !otp) {
      throw new BadRequestError('Email and OTP are required');
    }

    const otpRecord = await this.otpRepo.findByEmailAndOtp(email, otp);
    if (!otpRecord) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    const { name, password, phone } = otpRecord.userData;
    if (!password) {
      throw new BadRequestError('Invalid registration data in OTP session');
    }
    const user = await this.userRepo.create({ name, email, password, phone });
    const token = this.signToken(user._id.toString());

    await this.otpRepo.deleteById(otpRecord._id);

    return { token, user: this.formatUser(user) };
  }

  /**
   * Resend OTP with a 60-second cooldown guard.
   */
  async resendOtp(email: string): Promise<void> {
    if (!email) throw new BadRequestError('Email is required');

    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const existingOtp = await this.otpRepo.findByEmail(email);

    if (existingOtp) {
      const secondsSinceCreated =
        (Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000;
      const cooldownSeconds = 60;
      if (secondsSinceCreated < cooldownSeconds) {
        const waitSeconds = Math.ceil(cooldownSeconds - secondsSinceCreated);
        throw new TooManyRequestsError(
          `Please wait ${waitSeconds} seconds before requesting a new OTP`,
          { waitSeconds }
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await this.otpRepo.updateOtpByEmail(email, otp, new Date());
      appEvents.emit('user.registered', { email, otp });
      return;
    }

    throw new BadRequestError('No pending registration found for this email');
  }

  /**
   * Login — validates credentials and returns a signed token.
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepo.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.signToken(user._id.toString());
    return { token, user: this.formatUser(user) };
  }
}

export default new AuthService();
