// Type definitions shared across the frontend

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export type ServiceCategory =
  | 'venue'
  | 'hotel'
  | 'caterer'
  | 'cameraman'
  | 'dj'
  | 'decorator'
  | 'other';

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
  rating: number;
  totalReviews: number;
  isActive: boolean;
  createdBy: { name: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  _id: string;
  user: User | string;
  service: Service | string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: 'unpaid' | 'paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
