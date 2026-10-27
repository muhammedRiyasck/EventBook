import { Types } from 'mongoose';
import { IOtp } from '../../models/Otp';

export interface IOtpRepository {
  create(data: {
    email: string;
    otp: string;
    userData: { name: string; password?: string; phone?: string };
  }): Promise<IOtp>;
  findByEmail(email: string): Promise<IOtp | null>;
  findByEmailAndOtp(email: string, otp: string): Promise<IOtp | null>;
  deleteByEmail(email: string): Promise<void>;
  deleteById(id: string | Types.ObjectId): Promise<void>;
  updateOtpByEmail(
    email: string,
    otp: string,
    createdAt: Date
  ): Promise<IOtp | null>;
}
