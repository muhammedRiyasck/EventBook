import mongoose, { Document, Schema, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';
export type RefundStatus = 'none' | 'pending' | 'succeeded' | 'failed';
export type BookingStatusActor = 'admin' | 'customer' | 'system';

export interface IBookingStatusHistory {
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  changedBy?: Types.ObjectId;
  actor: BookingStatusActor;
  reason?: string;
  changedAt: Date;
}

export interface IBooking extends Document {
  user: Types.ObjectId;
  service: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalPrice: number;
  status: BookingStatus;
  statusHistory: IBookingStatusHistory[];
  paymentStatus: PaymentStatus;
  notes?: string;
  stripePaymentIntentId?: string;
  pendingStripePaymentIntentId?: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundStatus?: RefundStatus;
  refundedAt?: Date;
  timeSlotId?: string;   
  startTime?: string;    
  endTime?: string;      
  totalHours?: number;   
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
    statusHistory: [
      {
        fromStatus: {
          type: String,
          enum: ['pending', 'confirmed', 'cancelled', 'completed'],
          required: true,
        },
        toStatus: {
          type: String,
          enum: ['pending', 'confirmed', 'cancelled', 'completed'],
          required: true,
        },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        actor: {
          type: String,
          enum: ['admin', 'customer', 'system'],
          required: true,
        },
        reason: { type: String, maxlength: 500 },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'partially_refunded'],
      default: 'unpaid',
    },
    stripePaymentIntentId: { type: String },
    pendingStripePaymentIntentId: { type: String },
    // Refund fields
    refundId: { type: String },
    refundAmount: { type: Number, min: 0 },
    refundReason: { type: String, maxlength: 500 },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'succeeded', 'failed'],
      default: 'none',
    },
    refundedAt: { type: Date },
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
