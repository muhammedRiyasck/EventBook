/**
 * Calculates the total number of days between two dates (inclusive).
 * Same day (start === end) counts as 1 day.
 * Example: Jan 15 to Jan 20 = 6 days.
 */
export const calculateTotalDays = (startDate: Date, endDate: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / msPerDay) + 1);
};

/**
 * Calculates total hours between two HH:mm time strings.
 * Example: "09:00" to "13:00" = 4 hours.
 */
export const calculateTotalHours = (startTime: string, endTime: string): number => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  return Math.max(0, (endMins - startMins) / 60);
};

/**
 * Calculates the total booking price based on pricingUnit.
 *
 * @param basePrice   pricePerDay value from Service
 * @param pricingUnit 'per_day' | 'per_hour' | 'per_person' | 'per_project'
 * @param totalDays   number of days (used for per_day)
 * @param totalHours  number of hours (used for per_hour)
 * @param guestCount  number of guests (used for per_person)
 */
export const calculateTotalPrice = (
  basePrice: number,
  pricingUnit: string = 'per_day',
  totalDays: number = 1,
  totalHours: number = 0,
  guestCount: number = 1
): number => {
  switch (pricingUnit) {
    case 'per_hour':
      return basePrice * Math.max(1, totalHours);
    case 'per_person':
      return basePrice * Math.max(1, guestCount);
    case 'per_project':
      return basePrice; // flat fee regardless of days/guests
    case 'per_day':
    default:
      return basePrice * Math.max(1, totalDays);
  }
};

/**
 * Checks whether a new date range conflicts with any existing booked windows.
 * Returns true if there is a conflict (i.e., the dates are NOT available).
 */
export const hasAvailabilityConflict = (
  existingWindows: Array<{ startDate: Date; endDate: Date; isBooked: boolean }>,
  newStart: Date,
  newEnd: Date
): boolean => {
  const start = new Date(newStart);
  const end = new Date(newEnd);

  return existingWindows.some((window) => {
    if (!window.isBooked) return false;
    const wStart = new Date(window.startDate);
    const wEnd = new Date(window.endDate);
    // Overlap condition: new range starts before existing ends AND ends after existing starts
    return start < wEnd && end > wStart;
  });
};
