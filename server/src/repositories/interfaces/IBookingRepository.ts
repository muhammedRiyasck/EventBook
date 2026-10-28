import { Types } from 'mongoose';
import { IBooking, BookingStatus } from '../../models/Booking';

export interface BookingRevenueAggregates {
  overview: Array<{
    totalRevenue?: Array<{ total: number; count: number }>;
    periodRevenue?: Array<{ total: number; count: number }>;
  }>;
  dailyRevenue: Array<{
    _id: string;
    revenue: number;
    refunds: number;
    count: number;
  }>;
  totalDailyRows: number;
  topServices: Array<{
    _id?: unknown;
    title: string;
    category: string;
    revenue: number;
    bookings: number;
  }>;
  totalTopServices: number;
  refundStats: Array<{
    _id: null;
    totalRefunded: number;
    refundCount: number;
    fullRefunds: number;
    partialRefunds: number;
  }>;
}

export interface IBookingRepository {
  findById(id: string): Promise<IBooking | null>;
  findByIdWithService(id: string, serviceFields?: string): Promise<IBooking | null>;
  findByIdWithUserAndService(id: string): Promise<IBooking | null>;
  findByIdWithFullDetails(id: string): Promise<IBooking | null>;
  findByUser(
    query: Record<string, unknown>,
    skip: number,
    limit: number
  ): Promise<[IBooking[], number]>;
  findAll(
    query: Record<string, unknown>,
    skip: number,
    limit: number
  ): Promise<[IBooking[], number]>;
  create(data: Partial<IBooking>): Promise<IBooking>;
  save(booking: IBooking): Promise<IBooking>;
  atomicConfirm(
    bookingId: string,
    stripePaymentIntentId: string,
    statusHistory: object
  ): Promise<IBooking | null>;
  atomicStatusUpdate(
    id: string,
    fromStatus: BookingStatus,
    toStatus: BookingStatus,
    historyEntry: object,
    extraFields?: Record<string, unknown>
  ): Promise<IBooking | null>;
  countSlotBookings(
    serviceId: string,
    timeSlotId: string,
    dayStart: Date,
    dayEnd: Date
  ): Promise<number>;
  countDayBookings(serviceId: string, dayStart: Date, dayEnd: Date): Promise<number>;
  findExistingPending(
    userId: string | Types.ObjectId,
    serviceId: string,
    start: Date,
    end: Date,
    timeSlotId?: string
  ): Promise<IBooking | null>;
  findConfirmedDuplicate(
    userId: string | Types.ObjectId,
    serviceId: string,
    start: Date,
    end: Date
  ): Promise<IBooking | null>;
  findForSlotAvailability(
    serviceId: string,
    dayStart: Date,
    dayEnd: Date
  ): Promise<Pick<IBooking, 'timeSlotId' | 'guestCount'>[]>;
  findPaginatedTransactions(
    filter: Record<string, unknown>,
    sortField: string,
    skip: number,
    limit: number
  ): Promise<[IBooking[], number]>;
  getRevenueSummaryAggregates(
    sinceDate: Date,
    dailySkip: number,
    dailyLimit: number,
    servicesSkip: number,
    servicesLimit: number
  ): Promise<BookingRevenueAggregates>;
  findRefunds(
    filter: Record<string, unknown>,
    skip: number,
    limit: number
  ): Promise<[IBooking[], number]>;
}
