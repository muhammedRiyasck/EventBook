/**
 * Calculates the total number of days between two dates (inclusive).
 * For example: Jan 15 to Jan 20 = 5 days (the service is used on 5 days).
 */
export const calculateTotalDays = (startDate: Date, endDate: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffMs / msPerDay));
};

/**
 * Calculates the total booking price.
 */
export const calculateTotalPrice = (
  pricePerDay: number,
  totalDays: number
): number => {
  return pricePerDay * totalDays;
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
