import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import streamifier from 'streamifier';
import Service from '../models/Service';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../middleware/auth';

/**
 * Uploads a buffer to Cloudinary and returns the secure URL.
 */
const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

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
    } = req.query as Record<string, string>;

    const query: Record<string, unknown> = { isActive: true };

    // Full-text search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = category;
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
    type SortOption = Record<string, 1 | -1 | { $meta: 'textScore' }>;
    const sortOptions: Record<string, SortOption> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      pricePerDay_asc: { pricePerDay: 1 },
      pricePerDay_desc: { pricePerDay: -1 },
      rating_desc: { rating: -1 },
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
 * @desc    Create a new service (Admin only)
 * @route   POST /api/services
 * @access  Private/Admin
 */
export const createService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    // Upload images to Cloudinary if any were provided
    const imageUrls: string[] = [];
    const files = req.files as Express.Multer.File[] | undefined;

    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file.buffer, 'event-booking/services')
      );
      const urls = await Promise.all(uploadPromises);
      imageUrls.push(...urls);
    }

    // Parse JSON fields that come as strings in multipart/form-data
    const {
      title,
      category,
      description,
      pricePerDay,
      location,
      contact,
      tags,
      availability,
      customCategory,
      capacity,
      pricingUnit,
      cancellationPolicy,
      amenities,
      availableFrom,
      availableTo,
      bookingMode,
      timeSlots,
      maxBookingsPerDay,
    } = req.body;

    const service = await Service.create({
      title,
      category,
      description,
      pricePerDay: Number(pricePerDay),
      location: typeof location === 'string' ? JSON.parse(location) : location,
      contact: typeof contact === 'string' ? JSON.parse(contact) : contact,
      tags: typeof tags === 'string' ? JSON.parse(tags) : tags || [],
      availability: typeof availability === 'string' ? JSON.parse(availability) : availability || [],
      customCategory,
      capacity: capacity ? Number(capacity) : undefined,
      pricingUnit,
      cancellationPolicy,
      amenities: typeof amenities === 'string' ? JSON.parse(amenities) : amenities || [],
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      availableTo: availableTo ? new Date(availableTo) : undefined,
      bookingMode: bookingMode || 'date_range',
      timeSlots: typeof timeSlots === 'string' ? JSON.parse(timeSlots) : timeSlots || [],
      maxBookingsPerDay: maxBookingsPerDay ? Number(maxBookingsPerDay) : undefined,
      images: imageUrls,
      createdBy: req.user!._id,
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing service (Admin only)
 * @route   PUT /api/services/:id
 * @access  Private/Admin
 */
export const updateService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    // Upload new images to Cloudinary if provided
    const files = req.files as Express.Multer.File[] | undefined;
    let newImageUrls: string[] = [];

    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file.buffer, 'event-booking/services')
      );
      newImageUrls = await Promise.all(uploadPromises);
    }

    const {
      title,
      category,
      description,
      pricePerDay,
      location,
      contact,
      tags,
      availability,
      keepImages,
      customCategory,
      capacity,
      pricingUnit,
      cancellationPolicy,
      amenities,
      availableFrom,
      availableTo,
      bookingMode,
      timeSlots,
      maxBookingsPerDay,
    } = req.body;

    const existingImagesToKeep: string[] =
      typeof keepImages === 'string' ? JSON.parse(keepImages) : keepImages || service.images;

    const updatedFields: Partial<typeof service> = {};
    if (title) updatedFields.title = title;
    if (category) updatedFields.category = category;
    if (description) updatedFields.description = description;
    if (pricePerDay) updatedFields.pricePerDay = Number(pricePerDay);
    if (location) updatedFields.location = typeof location === 'string' ? JSON.parse(location) : location;
    if (contact) updatedFields.contact = typeof contact === 'string' ? JSON.parse(contact) : contact;
    if (tags) updatedFields.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    if (availability) updatedFields.availability = typeof availability === 'string' ? JSON.parse(availability) : availability;
    if (customCategory !== undefined) updatedFields.customCategory = customCategory;
    if (capacity) updatedFields.capacity = Number(capacity);
    if (pricingUnit) updatedFields.pricingUnit = pricingUnit;
    if (cancellationPolicy) updatedFields.cancellationPolicy = cancellationPolicy;
    if (amenities) updatedFields.amenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
    if (availableFrom) updatedFields.availableFrom = new Date(availableFrom);
    if (availableTo) updatedFields.availableTo = new Date(availableTo);
    if (bookingMode) updatedFields.bookingMode = bookingMode;
    if (timeSlots !== undefined) updatedFields.timeSlots = typeof timeSlots === 'string' ? JSON.parse(timeSlots) : timeSlots;
    if (maxBookingsPerDay) updatedFields.maxBookingsPerDay = Number(maxBookingsPerDay);
    updatedFields.images = [...existingImagesToKeep, ...newImageUrls];

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedService });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft-delete a service (Admin only) — sets isActive to false
 * @route   DELETE /api/services/:id
 * @access  Private/Admin
 */
export const deleteService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    service.isActive = false;
    await service.save();

    res.status(200).json({ success: true, message: 'Service removed successfully' });
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
    const Booking = (await import('../models/Booking')).default;

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

    let slots: any[] = [];
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

