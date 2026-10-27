import { Types } from 'mongoose';
import Otp, { IOtp } from '../models/Otp';
import { IOtpRepository } from './interfaces/IOtpRepository';

export class OtpRepository implements IOtpRepository {
  async create(data: {
    email: string;
    otp: string;
    userData: { name: string; password?: string; phone?: string };
  }): Promise<IOtp> {
    return Otp.create(data);
  }

  async findByEmail(email: string): Promise<IOtp | null> {
    return Otp.findOne({ email });
  }

  async findByEmailAndOtp(email: string, otp: string): Promise<IOtp | null> {
    return Otp.findOne({ email, otp });
  }

  async deleteByEmail(email: string): Promise<void> {
    await Otp.deleteMany({ email });
  }

  async deleteById(id: string | Types.ObjectId): Promise<void> {
    await Otp.deleteOne({ _id: id });
  }

  async updateOtpByEmail(
    email: string,
    otp: string,
    createdAt: Date
  ): Promise<IOtp | null> {
    return Otp.findOneAndUpdate(
      { email },
      { $set: { otp, createdAt } },
      { new: true }
    );
  }
}

export default new OtpRepository();
