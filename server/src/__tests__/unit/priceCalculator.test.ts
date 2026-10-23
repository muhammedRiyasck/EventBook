import { describe, it, expect } from 'vitest';
import {
  calculateTotalDays,
  calculateTotalHours,
  calculateTotalPrice,
  hasAvailabilityConflict,
} from '../../utils/priceCalculator';

describe('Price and Time Calculations (Unit)', () => {
  describe('calculateTotalDays', () => {
    it('returns 1 day for same-day booking', () => {
      const date = new Date('2026-11-01');
      expect(calculateTotalDays(date, date)).toBe(1);
    });

    it('calculates inclusive days correctly', () => {
      const start = new Date('2026-11-01');
      const end = new Date('2026-11-05');
      expect(calculateTotalDays(start, end)).toBe(5);
    });
  });

  describe('calculateTotalHours', () => {
    it('calculates duration between HH:mm strings', () => {
      expect(calculateTotalHours('09:00', '13:00')).toBe(4);
      expect(calculateTotalHours('10:30', '12:00')).toBe(1.5);
    });

    it('returns 0 when end time is earlier or equal', () => {
      expect(calculateTotalHours('14:00', '12:00')).toBe(0);
    });
  });

  describe('calculateTotalPrice', () => {
    it('calculates per_day pricing', () => {
      expect(calculateTotalPrice(1000, 'per_day', 3)).toBe(3000);
    });

    it('calculates per_hour pricing', () => {
      expect(calculateTotalPrice(500, 'per_hour', 1, 4)).toBe(2000);
    });

    it('calculates per_person pricing', () => {
      expect(calculateTotalPrice(250, 'per_person', 1, 0, 20)).toBe(5000);
    });

    it('calculates per_project flat fee', () => {
      expect(calculateTotalPrice(15000, 'per_project', 5, 20, 100)).toBe(15000);
    });
  });

  describe('hasAvailabilityConflict', () => {
    const existing = [
      {
        startDate: new Date('2026-11-10T00:00:00Z'),
        endDate: new Date('2026-11-15T00:00:00Z'),
        isBooked: true,
      },
      {
        startDate: new Date('2026-11-20T00:00:00Z'),
        endDate: new Date('2026-11-22T00:00:00Z'),
        isBooked: false, // not booked
      },
    ];

    it('returns true when new range overlaps with booked window', () => {
      expect(
        hasAvailabilityConflict(
          existing,
          new Date('2026-11-12T00:00:00Z'),
          new Date('2026-11-18T00:00:00Z')
        )
      ).toBe(true);
    });

    it('returns false when range is outside booked window', () => {
      expect(
        hasAvailabilityConflict(
          existing,
          new Date('2026-11-01T00:00:00Z'),
          new Date('2026-11-05T00:00:00Z')
        )
      ).toBe(false);
    });

    it('returns false when window is not booked', () => {
      expect(
        hasAvailabilityConflict(
          existing,
          new Date('2026-11-20T00:00:00Z'),
          new Date('2026-11-22T00:00:00Z')
        )
      ).toBe(false);
    });
  });
});
