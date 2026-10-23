import { describe, it, expect, vi, beforeEach } from 'vitest';
import bookingService from '../../services/BookingService';
import bookingRepository from '../../repositories/BookingRepository';
import serviceRepository from '../../repositories/ServiceRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../../errors/AppError';
import { IUser } from '../../models/User';

vi.mock('../../repositories/BookingRepository', () => ({
  default: {
    findExistingPending: vi.fn(),
    findConfirmedDuplicate: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    countDayBookings: vi.fn(),
  },
}));

vi.mock('../../repositories/ServiceRepository', () => ({
  default: {
    findActive: vi.fn(),
    findById: vi.fn(),
    atomicReserveDates: vi.fn(),
    atomicReleaseDates: vi.fn(),
  },
}));

vi.mock('../../config/stripe', () => ({
  default: {
    refunds: { create: vi.fn() },
    paymentIntents: { retrieve: vi.fn(), cancel: vi.fn() },
  },
}));

vi.mock('../../utils/eventEmitter', () => ({
  default: {
    emit: vi.fn(),
  },
}));

describe('BookingService (Unit)', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Customer',
    email: 'customer@example.com',
    role: 'user',
  } as unknown as IUser;

  const mockActiveService = {
    _id: '507f1f77bcf86cd799439012',
    title: 'Grand Hall',
    bookingMode: 'date_range',
    pricePerDay: 1000,
    isFree: false,
    pricingUnit: 'per_day',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBooking - Date Validation', () => {
    it('throws BadRequestError if start date is in the past', async () => {
      vi.mocked(serviceRepository.findActive).mockResolvedValue(mockActiveService as never);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await expect(
        bookingService.createBooking(mockUser, {
          serviceId: '507f1f77bcf86cd799439012',
          startDate: yesterday.toISOString().split('T')[0],
          endDate: yesterday.toISOString().split('T')[0],
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('throws BadRequestError if end date is earlier than start date', async () => {
      vi.mocked(serviceRepository.findActive).mockResolvedValue(mockActiveService as never);

      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 5);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 3);

      await expect(
        bookingService.createBooking(mockUser, {
          serviceId: '507f1f77bcf86cd799439012',
          startDate: futureStart.toISOString().split('T')[0],
          endDate: futureEnd.toISOString().split('T')[0],
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('throws NotFoundError if service does not exist or is inactive', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 5);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 7);

      vi.mocked(serviceRepository.findActive).mockResolvedValue(null);

      await expect(
        bookingService.createBooking(mockUser, {
          serviceId: '507f1f77bcf86cd799439012',
          startDate: futureStart.toISOString().split('T')[0],
          endDate: futureEnd.toISOString().split('T')[0],
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError if atomic date reservation detects conflict', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 5);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 7);

      vi.mocked(serviceRepository.findActive).mockResolvedValue(mockActiveService as never);
      vi.mocked(bookingRepository.findExistingPending).mockResolvedValue(null);
      vi.mocked(bookingRepository.findConfirmedDuplicate).mockResolvedValue(null);
      // Atomic reservation returns null (simulating concurrent booking winning the lock)
      vi.mocked(serviceRepository.atomicReserveDates).mockResolvedValue(null);

      await expect(
        bookingService.createBooking(mockUser, {
          serviceId: '507f1f77bcf86cd799439012',
          startDate: futureStart.toISOString().split('T')[0],
          endDate: futureEnd.toISOString().split('T')[0],
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('cancelBooking - State Machine', () => {
    it('throws NotFoundError if booking does not exist', async () => {
      vi.mocked(bookingRepository.findById).mockResolvedValue(null);

      await expect(
        bookingService.cancelBooking(mockUser, '507f1f77bcf86cd799439099')
      ).rejects.toThrow(NotFoundError);
    });

    it('throws BadRequestError if booking is already cancelled', async () => {
      vi.mocked(bookingRepository.findById).mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        user: mockUser._id,
        status: 'cancelled',
      } as never);

      await expect(
        bookingService.cancelBooking(mockUser, '507f1f77bcf86cd799439099')
      ).rejects.toThrow(BadRequestError);
    });

    it('throws BadRequestError if booking is already completed', async () => {
      vi.mocked(bookingRepository.findById).mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        user: mockUser._id,
        status: 'completed',
      } as never);

      await expect(
        bookingService.cancelBooking(mockUser, '507f1f77bcf86cd799439099')
      ).rejects.toThrow(BadRequestError);
    });
  });
});
