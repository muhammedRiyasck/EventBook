// Type definitions shared across the frontend

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export type ServiceCategory =
  "venue" | "hotel" | "caterer" | "cameraman" | "dj" | "decorator" | "other";

export type BookingMode = "date_range" | "single_day" | "time_slot";

export interface TimeSlot {
  _id: string;
  label: string;       // e.g. "Morning Show", "Evening Show"
  startTime: string;   // "HH:mm" 24h e.g. "09:00"
  endTime: string;     // "HH:mm" e.g. "13:00"
  maxBookings: number; // how many bookings allowed per slot per day
  isActive: boolean;
}

export interface AvailabilityWindow {
  startDate: string;
  endDate: string;
  isBooked: boolean;
}

export interface Service {
  _id: string;
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
  availability: AvailabilityWindow[];
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
  availableFrom?: string;
  availableTo?: string;
  // Time slot fields
  bookingMode?: BookingMode;
  timeSlots?: TimeSlot[];
  maxBookingsPerDay?: number;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  createdBy: { name: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "partially_refunded";
export type RefundStatus = "none" | "pending" | "succeeded" | "failed";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type BookingStatusActor = "admin" | "customer" | "system";

export interface BookingStatusHistory {
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  changedBy?: User | string;
  actor: BookingStatusActor;
  reason?: string;
  changedAt: string;
}

export interface Booking {
  _id: string;
  user: User | string;
  service: Service | string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: number;
  status: BookingStatus;
  statusHistory?: BookingStatusHistory[];
  paymentStatus: PaymentStatus;
  notes?: string;
  // Stripe & Refund fields
  stripePaymentIntentId?: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundStatus?: RefundStatus;
  refundedAt?: string;
  // Time slot fields
  timeSlotId?: string;
  startTime?: string;   // "HH:mm"
  endTime?: string;     // "HH:mm"
  totalHours?: number;
  // Guest / seat fields
  guestCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StripeTransactionDetails {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  receiptUrl?: string | null;
  paymentMethod: string;
  last4?: string | null;
  brand?: string | null;
  chargeId?: string | null;
}

export interface RevenueSummaryData {
  overview: {
    totalRevenue: number;
    totalTransactions: number;
    refundedRevenue: number;
    refundCount: number;
    netRevenue: number;
    periodRevenue: number;
    periodTransactions: number;
  };
  dailyRevenue: Array<{
    _id: string;
    revenue: number;
    refunds: number;
    count: number;
  }>;
  topServices: Array<{
    _id: string;
    title: string;
    category: string;
    revenue: number;
    bookings: number;
  }>;
  refundStats: {
    totalRefunded: number;
    count: number;
    fullRefunds: number;
    partialRefunds: number;
  };
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ServiceFilters {
  search?: string;
  category?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
  page?: string;
}
