import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import streamifier from 'streamifier';
import Service from '../../models/Service';
import cloudinary from '../../config/cloudinary';
import { AuthRequest } from '../../middleware/auth';

/**
 * Uploads a buffer to Cloudinary and returns the secure URL.
 */
const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  timeoutMs = 25000
): Promise<string> => {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Image upload to Cloudinary timed out (25s)'));
      }
    }, timeoutMs);

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error || !result) {
          return reject(error || new Error('Image upload to Cloudinary failed'));
        }
        resolve(result.secure_url);
      }
    );

    stream.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    streamifier.createReadStream(buffer).pipe(stream);
  });
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
      isFree,
    } = req.body;

    const service = await Service.create({
      title,
      category,
      description,
      isFree: isFree === 'true' || isFree === true,
      pricePerDay: (isFree === 'true' || isFree === true) ? 0 : Number(pricePerDay),
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
      isFree,
    } = req.body;

    let existingImagesToKeep: string[] = [];
    if (keepImages !== undefined) {
      try {
        existingImagesToKeep = typeof keepImages === 'string' ? JSON.parse(keepImages) : keepImages;
        if (!Array.isArray(existingImagesToKeep)) existingImagesToKeep = [];
      } catch {
        existingImagesToKeep = [];
      }
    } else {
      existingImagesToKeep = service.images || [];
    }

    const updatedFields: Partial<typeof service> = {};
    if (title) updatedFields.title = title;
    if (category) updatedFields.category = category;
    if (description) updatedFields.description = description;
    
    if (isFree !== undefined) {
      updatedFields.isFree = isFree === 'true' || isFree === true;
    }
    
    if (updatedFields.isFree) {
      updatedFields.pricePerDay = 0;
    } else if (pricePerDay !== undefined) {
      updatedFields.pricePerDay = Number(pricePerDay);
    }

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
