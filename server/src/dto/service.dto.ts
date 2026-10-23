/**
 * Data Transfer Objects for the Service domain.
 */

export interface ServiceLocationDto {
  address: string;
  city: string;
  state?: string;
  country?: string;
}

export interface ServiceContactDto {
  phone?: string;
  email?: string;
  website?: string;
}

export interface CreateServiceDto {
  title: string;
  category: string;
  description: string;
  pricePerDay: number;
  isFree?: boolean;
  pricingUnit?: 'per_day' | 'per_hour' | 'per_person' | 'per_project';
  location: ServiceLocationDto;
  contact?: ServiceContactDto;
  tags?: string[];
  capacity?: number;
  cancellationPolicy?: 'Flexible' | 'Moderate' | 'Strict';
  amenities?: string[];
  availableFrom?: string;
  availableTo?: string;
  bookingMode?: 'date_range' | 'time_slot';
  timeSlots?: unknown[];
  maxBookingsPerDay?: number;
  customCategory?: string;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {
  keepImages?: string[];
}

export interface GetServicesQueryDto {
  page?: string;
  limit?: string;
  sort?: string;
  category?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  bookingMode?: string;
  includeInactive?: string;
}
