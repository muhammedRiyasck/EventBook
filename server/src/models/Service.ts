import mongoose, { Document, Schema, Types } from 'mongoose';

export type ServiceCategory =
  | 'venue'
  | 'hotel'
  | 'caterer'
  | 'cameraman'
  | 'dj'
  | 'decorator'
  | 'other';

export type BookingMode = 'date_range' | 'single_day' | 'time_slot';

export interface ITimeSlot {
  _id: Types.ObjectId;
  label: string;       // e.g. "Morning Show", "Evening Session"
  startTime: string;   // "HH:mm" 24h
  endTime: string;     // "HH:mm" 24h
  maxBookings: number; // simultaneous bookings allowed per slot per day
  isActive: boolean;
}

export interface IAvailabilityWindow {
  startDate: Date;
  endDate: Date;
  isBooked: boolean;
  timeSlotId?: string; // tracks which slot is booked (for time_slot mode)
  bookingCount?: number; // tracks how many bookings on this date (for multi-booking)
}

export interface IService extends Document {
  title: string;
  category: ServiceCategory;
  description: string;
  pricePerDay: number;
  location: {
    city: string;
    state: string;
    address: string;
  };
  images: string[];
  availability: IAvailabilityWindow[];
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  tags: string[];
  customCategory?: string;
  capacity?: number;
  pricingUnit?: 'per_day' | 'per_hour' | 'per_person' | 'per_project';
  cancellationPolicy?: 'Flexible' | 'Moderate' | 'Strict';
  amenities?: string[];
  availableFrom?: Date;
  availableTo?: Date;
  // Time slot support
  bookingMode: BookingMode;
  timeSlots: ITimeSlot[];
  maxBookingsPerDay?: number;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isFree: boolean;
}

const TimeSlotSchema = new Schema<ITimeSlot>(
  {
    label: {
      type: String,
      required: [true, 'Slot label is required'],
      trim: true,
      maxlength: [80, 'Label cannot exceed 80 characters'],
    },
    startTime: {
      type: String,
      required: [true, 'Slot start time is required'],
      match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'Slot end time is required'],
      match: [/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'],
    },
    maxBookings: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Max bookings must be at least 1'],
    },
    isActive: { type: Boolean, default: true },
  }
);

const AvailabilitySchema = new Schema<IAvailabilityWindow>(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isBooked: { type: Boolean, default: false },
    timeSlotId: { type: String },
    bookingCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ServiceSchema = new Schema<IService>(
  {
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    category: {
      type: String,
      enum: ['venue', 'hotel', 'caterer', 'cameraman', 'dj', 'decorator', 'other'],
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    pricePerDay: {
      type: Number,
      required: [
        function(this: IService) {
          return !this.isFree;
        },
        'Price per day is required unless service is free'
      ],
      min: [0, 'Price cannot be negative'],
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    location: {
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
    },
    images: [{ type: String }],
    availability: [AvailabilitySchema],
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      website: { type: String },
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    customCategory: { type: String, trim: true },
    capacity: { type: Number, min: 1 },
    pricingUnit: {
      type: String,
      enum: ['per_day', 'per_hour', 'per_person', 'per_project'],
      default: 'per_day',
    },
    cancellationPolicy: {
      type: String,
      enum: ['Flexible', 'Moderate', 'Strict'],
    },
    amenities: [{ type: String, trim: true }],
    availableFrom: { type: Date },
    availableTo: { type: Date },
    // Time slot fields
    bookingMode: {
      type: String,
      enum: ['date_range', 'single_day', 'time_slot'],
      default: 'date_range',
    },
    timeSlots: [TimeSlotSchema],
    maxBookingsPerDay: {
      type: Number,
      min: [1, 'Max bookings per day must be at least 1'],
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Full-text search index on title and description
ServiceSchema.index({ title: 'text', description: 'text', tags: 'text' });
// Regular indexes for filters
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ 'location.city': 1 });
ServiceSchema.index({ pricePerDay: 1 });
ServiceSchema.index({ isActive: 1 });

export default mongoose.model<IService>('Service', ServiceSchema);
