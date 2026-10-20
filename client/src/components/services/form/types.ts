import { TimeSlot } from "@/types";

export const CATEGORIES = [
  "venue",
  "hotel",
  "caterer",
  "cameraman",
  "dj",
  "decorator",
  "other",
];

export interface ServiceFormData {
  title: string;
  category: string;
  description: string;
  isFree: boolean;
  pricePerDay: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  tags: string[];
  customCategory: string;
  capacity: string;
  pricingUnit: string;
  cancellationPolicy: string;
  amenities: string[];
  availableFrom: string;
  availableTo: string;
  bookingMode: string;
  maxBookingsPerDay: string;
}

export interface ServiceFormInitialData {
  title?: string;
  category?: string;
  description?: string;
  pricePerDay?: number;
  location?: { city: string; state: string; address: string };
  contact?: { phone: string; email: string; website?: string };
  tags?: string[];
  images?: string[];
  customCategory?: string;
  capacity?: number;
  pricingUnit?: string;
  cancellationPolicy?: string;
  amenities?: string[];
  availableFrom?: string;
  availableTo?: string;
  bookingMode?: string;
  timeSlots?: TimeSlot[];
  maxBookingsPerDay?: number;
  isFree?: boolean;
}

export type SlotItem = Omit<TimeSlot, "_id">;
