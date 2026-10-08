import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User';
import env from '../config/env';
import { AuthRequest } from '../middleware/auth';
import Otp from '../models/Otp';
import appEvents from '../utils/eventEmitter';

/**
 * Generates a signed JWT token for the given user ID.
 */
const signToken = (id: string): string => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * @desc    Register a new user (Init) - Sends OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp,
      userData: { name, password, phone },
    });

    appEvents.emit('user.registered', { email, otp });

    res.status(200).json({
      success: true,
      message: 'OTP sent to email. Please verify to complete registration.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP and complete registration
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP are required' });
      return;
    }

    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    const { name, password, phone } = otpRecord.userData;

    const user = await User.create({ name, email, password, phone });
    const token = signToken(user._id.toString());

    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend OTP for registration
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    const existingOtp = await Otp.findOne({ email });
    if (existingOtp) {
      const secondsSinceCreated = (Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000;
      const cooldownSeconds = 60;
      if (secondsSinceCreated < cooldownSeconds) {
        const waitSeconds = Math.ceil(cooldownSeconds - secondsSinceCreated);
        res.status(429).json({
          success: false,
          message: `Please wait ${waitSeconds} seconds before requesting a new OTP`,
          waitSeconds,
        });
        return;
      }
    }

    if (!existingOtp) {
      res.status(400).json({ success: false, message: 'No pending registration found for this email' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    existingOtp.otp = otp;
    existingOtp.createdAt = new Date();
    await existingOtp.save();

    appEvents.emit('user.registered', { email, otp });

    res.status(200).json({
      success: true,
      message: 'A new OTP has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user or admin
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Explicitly select password since it's excluded by default
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = signToken(user._id.toString());

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};
