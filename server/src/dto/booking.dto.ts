/**
 * Data Transfer Objects for the Booking domain.
 */

export interface CreateBookingDto {
  serviceId: string;
  startDate: string; // ISO 8601 string — parsed to Date inside service
  endDate: string;
  notes?: string;
  guestCount?: number;
  timeSlotId?: string;
}

export interface UpdateBookingStatusDto {
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason?: string;
}

export interface CancelBookingDto {
  reason?: string;
}

export interface GetMyBookingsQueryDto {
  status?: string;
  type?: 'upcoming' | 'past' | 'cancelled' | 'all';
  page?: string;
  limit?: string;
}

export interface GetAllBookingsQueryDto {
  page?: string;
  limit?: string;
  status?: string;
}
