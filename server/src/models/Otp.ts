import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  userData: {
    name: string;
    password?: string;
    phone?: string;
  };
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    userData: {
      type: Object,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // TTL index: document auto-deletes 5 minutes after createdAt
      // Resending updates createdAt to reset the TTL
    },
  },
  { timestamps: false }
);

// Separate TTL index on createdAt — allows reset on resend
OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

export default mongoose.model<IOtp>('Otp', OtpSchema);
