import { Request, Response, NextFunction } from 'express';
import Service, { ITimeSlot } from '../../models/Service';

/**
 * @desc    Get all services with search, filter, pagination, and sorting
 * @route   GET /api/services
 * @access  Public
 */
export const getServices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '12',
      sort = 'newest',
      category,
      city,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      search,
      bookingMode,
      includeInactive,
    } = req.query as Record<string, string>;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query: Record<string, unknown> = {};

    if (includeInactive !== 'true') {
      query.isActive = true;
      // Exclude services whose availability window has already expired
      query.$or = [
        { availableTo: { $exists: false } },
        { availableTo: null },
        { availableTo: { $gte: today } },
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Booking mode filter
    if (bookingMode && bookingMode !== 'all') {
      query.bookingMode = bookingMode;
    }

    // Substring / regex search across title, description, city, tags
    if (search && search.trim()) {
      const s = search.trim();
      const searchRegex = { $regex: s, $options: 'i' };
      const searchConditions: Record<string, unknown>[] = [
        { title: searchRegex },
        { description: searchRegex },
        { 'location.city': searchRegex },
        { tags: searchRegex },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    // City filter (case-insensitive)
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) (query.pricePerDay as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (query.pricePerDay as Record<string, number>).$lte = Number(maxPrice);
    }

    // Date availability filter — exclude services fully booked on those dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      query['availability'] = {
        $not: {
          $elemMatch: {
            isBooked: true,
            startDate: { $lte: end },
            endDate: { $gte: start },
          },
        },
      };
    }

    // Sorting
    type SortOption = Record<string, 1 | -1>;
    const sortOptions: Record<string, SortOption> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { pricePerDay: 1 },
      pricePerDay_asc: { pricePerDay: 1 },
      price_desc: { pricePerDay: -1 },
      pricePerDay_desc: { pricePerDay: -1 },
      rating_desc: { rating: -1 },
      title: { title: 1 },
    };
    const selectedSort: SortOption = sortOptions[sort] || sortOptions.newest;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      Service.find(query)
        .sort(selectedSort)
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email'),
      Service.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: services,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
export const getServiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!service || !service.isActive) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available time slots for a service on a given date
 * @route   GET /api/services/:id/available-slots?date=YYYY-MM-DD
 * @access  Public
 */
export const getAvailableSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.query as { date?: string };

    if (!date) {
      res.status(400).json({ success: false, message: 'Query param ?date=YYYY-MM-DD is required' });
      return;
    }

    const service = await Service.findById(req.params.id);
    if (!service || !service.isActive) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    // Build date window for the requested day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    // Import Booking dynamically to avoid circular dep
    const Booking = (await import('../../models/Booking')).default;

    // Fetch all bookings for this date
    const existingBookings = await Booking.find({
      service: req.params.id,
      startDate: { $gte: dayStart, $lt: dayEnd },
      status: { $nin: ['cancelled'] },
    }).select('timeSlotId guestCount');

    let dailyBookingsCount = 0;
    let dailyGuestsCount = 0;
    const slotBookingCounts: Record<string, number> = {};

    for (const b of existingBookings) {
      dailyBookingsCount++;
      if (b.guestCount) {
        dailyGuestsCount += b.guestCount;
      }
      if (b.timeSlotId) {
        slotBookingCounts[b.timeSlotId] = (slotBookingCounts[b.timeSlotId] || 0) + 1;
      }
    }

    type SlotAvailability = Omit<ITimeSlot, 'isActive'> & {
      bookedCount: number;
      isAvailable: boolean;
    };
    let slots: SlotAvailability[] = [];
    if (service.bookingMode === 'time_slot' && service.timeSlots?.length) {
      slots = service.timeSlots
        .filter((s) => s.isActive)
        .map((s) => {
          const booked = slotBookingCounts[s._id.toString()] || 0;
          return {
            _id: s._id,
            label: s.label,
            startTime: s.startTime,
            endTime: s.endTime,
            maxBookings: s.maxBookings,
            bookedCount: booked,
            isAvailable: booked < s.maxBookings,
          };
        });
    }

    res.status(200).json({ 
      success: true, 
      data: slots,
      dailyStats: {
        bookings: dailyBookingsCount,
        guests: dailyGuestsCount
      }
    });
  } catch (error) {
    next(error);
  }
};
