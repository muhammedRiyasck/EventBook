import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from '../../services/AuthService';
import userRepository from '../../repositories/UserRepository';
import Otp from '../../models/Otp';
import appEvents from '../../utils/eventEmitter';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../errors/AppError';

// Mock dependencies
vi.mock('../../repositories/UserRepository');
vi.mock('../../models/Otp');
vi.mock('../../utils/eventEmitter', () => ({
  default: {
    emit: vi.fn(),
  },
}));

describe('AuthService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initiateRegistration', () => {
    it('throws ConflictError if user with email already exists', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        _id: 'user123',
        email: 'test@example.com',
      } as never);

      await expect(
        authService.initiateRegistration({
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('creates OTP session and emits event when email is available', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(Otp.deleteMany).mockResolvedValue({} as never);
      vi.mocked(Otp.create).mockResolvedValue({} as never);

      await authService.initiateRegistration({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(Otp.deleteMany).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(Otp.create).toHaveBeenCalled();
      expect(appEvents.emit).toHaveBeenCalledWith('user.registered', expect.objectContaining({
        email: 'test@example.com',
      }));
    });
  });

  describe('verifyOtpAndRegister', () => {
    it('throws BadRequestError if email or OTP is missing', async () => {
      await expect(authService.verifyOtpAndRegister('', '123456')).rejects.toThrow(BadRequestError);
      await expect(authService.verifyOtpAndRegister('test@example.com', '')).rejects.toThrow(BadRequestError);
    });

    it('throws BadRequestError if OTP is invalid or expired', async () => {
      vi.mocked(Otp.findOne).mockResolvedValue(null);

      await expect(
        authService.verifyOtpAndRegister('test@example.com', '999999')
      ).rejects.toThrow(BadRequestError);
    });

    it('creates user and returns signed JWT token on valid OTP', async () => {
      const mockOtpRecord = {
        _id: 'otp123',
        email: 'test@example.com',
        otp: '123456',
        userData: {
          name: 'Jane Doe',
          password: 'hashedpassword',
          phone: '9876543210',
        },
      };

      vi.mocked(Otp.findOne).mockResolvedValue(mockOtpRecord as never);
      vi.mocked(userRepository.create).mockResolvedValue({
        _id: 'user999',
        name: 'Jane Doe',
        email: 'test@example.com',
        role: 'user',
        phone: '9876543210',
        createdAt: new Date(),
      } as never);
      vi.mocked(Otp.deleteOne).mockResolvedValue({} as never);

      const result = await authService.verifyOtpAndRegister('test@example.com', '123456');

      expect(result).toHaveProperty('token');
      expect(result.user).toEqual({
        _id: 'user999',
        name: 'Jane Doe',
        email: 'test@example.com',
        role: 'user',
        phone: '9876543210',
      });
      expect(Otp.deleteOne).toHaveBeenCalledWith({ _id: 'otp123' });
    });
  });

  describe('login', () => {
    it('throws UnauthorizedError if user does not exist', async () => {
      vi.mocked(userRepository.findByEmailWithPassword).mockResolvedValue(null);

      await expect(
        authService.login({ email: 'notfound@example.com', password: 'password123' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError if password does not match', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        comparePassword: vi.fn().mockResolvedValue(false),
      };

      vi.mocked(userRepository.findByEmailWithPassword).mockResolvedValue(mockUser as never);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('returns token and user on successful credentials', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        phone: '1234567890',
        password: 'hashedpassword',
        comparePassword: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(userRepository.findByEmailWithPassword).mockResolvedValue(mockUser as never);

      const result = await authService.login({ email: 'test@example.com', password: 'password123' });

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
    });
  });
});
