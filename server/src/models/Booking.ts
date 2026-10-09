import mongoose, { Document, Schema, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid';

export interface IBooking extends Document {
  user: Types.ObjectId;
  service: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  // Time slot fields
  timeSlotId?: string;   // references the chosen slot _id in service.timeSlots
  startTime?: string;    // "HH:mm" — denormalized from slot for display/email
  endTime?: string;      // "HH:mm"
  totalHours?: number;   // computed from slot times (for per_hour pricing)
  // Guest / seat fields
  guestCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    totalDays: {
      type: Number,
      required: true,
      min: [1, 'Booking must be for at least 1 day'],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
    guestCount: {
      type: Number,
      min: [1, 'Guest count must be at least 1'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    // Time slot fields
    timeSlotId: { type: String },
    startTime: {
      type: String,
      match: [/^\d{2}:\d{2}$/, 'startTime must be in HH:mm format'],
    },
    endTime: {
      type: String,
      match: [/^\d{2}:\d{2}$/, 'endTime must be in HH:mm format'],
    },
    totalHours: {
      type: Number,
      min: [0, 'Total hours cannot be negative'],
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
BookingSchema.index({ user: 1 });
BookingSchema.index({ service: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ startDate: 1, endDate: 1 });
BookingSchema.index({ service: 1, startDate: 1, timeSlotId: 1 }); // fast slot conflict check

export default mongoose.model<IBooking>('Booking', BookingSchema);
