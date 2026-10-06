import mongoose, { Document, Schema, Types } from 'mongoose';

export type ServiceCategory =
  | 'venue'
  | 'hotel'
  | 'caterer'
  | 'cameraman'
  | 'dj'
  | 'decorator'
  | 'other';

export interface IAvailabilityWindow {
  startDate: Date;
  endDate: Date;
  isBooked: boolean;
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
  rating: number;
  totalReviews: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailabilityWindow>(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isBooked: { type: Boolean, default: false },
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
      required: [true, 'Price per day is required'],
      min: [0, 'Price cannot be negative'],
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
