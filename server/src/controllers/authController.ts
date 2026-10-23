import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { BadRequestError } from '../errors/AppError';
import authService from '../services/AuthService';
import { AuthRequest } from '../middleware/auth';

/**
 * Validates input, delegates to AuthService, formats the response.
 */

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new BadRequestError(errors.array()[0].msg as string);

    await authService.initiateRegistration(req.body);
    res.status(200).json({ success: true, message: 'OTP sent to email. Please verify to complete registration.' });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyOtpAndRegister(email, otp);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.resendOtp(req.body.email);
    res.status(200).json({ success: true, message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new BadRequestError(errors.array()[0].msg as string);

    const result = await authService.login(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};
