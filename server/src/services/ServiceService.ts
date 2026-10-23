import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary';
import serviceRepository from '../repositories/ServiceRepository';
import bookingRepository from '../repositories/BookingRepository';
import { IService } from '../models/Service';
import { NotFoundError } from '../errors/AppError';
import { CreateServiceDto, UpdateServiceDto, GetServicesQueryDto } from '../dto/service.dto';
import { IUser } from '../models/User';
import { ITimeSlot } from '../models/Service';

interface SlotAvailability {
  _id: ITimeSlot['_id'];
  label: string;
  startTime: string;
  endTime: string;
  maxBookings: number;
  bookedCount: number;
  isAvailable: boolean;
}

/**
 * ServiceService — all service management business logic.
 */
export class ServiceService {
  /**
   * Upload a buffer to Cloudinary with a 25-second timeout.
   */
  private uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Image upload to Cloudinary timed out (25s)'));
        }
      }, 25000);

      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (error || !result) return reject(error || new Error('Cloudinary upload failed'));
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
  }

  private parseJsonField<T>(value: unknown, fallback: T): T {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    }
    return (value as T) ?? fallback;
  }

  async getServices(query: GetServicesQueryDto) {
    const [services, total] = await serviceRepository.findMany(query);
    const pageNum = Math.max(1, parseInt(query.page ?? '1'));
    const limitNum = Math.min(50, Math.max(1, parseInt(query.limit ?? '12')));
    const totalPages = Math.ceil(total / limitNum);

    return {
      data: services,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  async getServiceById(id: string): Promise<IService> {
    const service = await serviceRepository.findByIdPopulated(id);
    if (!service || !service.isActive) throw new NotFoundError('Service not found');
    return service;
  }

  async createService(
    admin: IUser,
    dto: CreateServiceDto,
    files?: Express.Multer.File[]
  ): Promise<IService> {
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      const uploads = files.map((f) => this.uploadToCloudinary(f.buffer, 'event-booking/services'));
      imageUrls.push(...(await Promise.all(uploads)));
    }

    const isFree = dto.isFree === true || (dto.isFree as unknown as string) === 'true';
    return serviceRepository.create({
      ...dto,
      isFree,
      pricePerDay: isFree ? 0 : Number(dto.pricePerDay),
      location: this.parseJsonField(dto.location, dto.location),
      contact: this.parseJsonField(dto.contact, dto.contact),
      tags: this.parseJsonField(dto.tags, []),
      availability: this.parseJsonField([] as unknown, []) as IService['availability'],
      amenities: this.parseJsonField(dto.amenities, []),
      timeSlots: this.parseJsonField(dto.timeSlots, []) as IService['timeSlots'],
      images: imageUrls,
      createdBy: admin._id.toString(),
    });
  }

  async updateService(
    id: string,
    dto: UpdateServiceDto,
    files?: Express.Multer.File[]
  ): Promise<IService> {
    const service = await serviceRepository.findById(id);
    if (!service) throw new NotFoundError('Service not found');

    let newImageUrls: string[] = [];
    if (files && files.length > 0) {
      const uploads = files.map((f) => this.uploadToCloudinary(f.buffer, 'event-booking/services'));
      newImageUrls = await Promise.all(uploads);
    }

    const keepImages = this.parseJsonField<string[]>(dto.keepImages, service.images || []);
    const isFree =
      dto.isFree === true || (dto.isFree as unknown as string) === 'true'
        ? true
        : dto.isFree === false || (dto.isFree as unknown as string) === 'false'
        ? false
        : undefined;

    const updateFields: Record<string, unknown> = {};
    if (dto.title !== undefined) updateFields.title = dto.title;
    if (dto.category !== undefined) updateFields.category = dto.category;
    if (dto.description !== undefined) updateFields.description = dto.description;
    if (isFree !== undefined) {
      updateFields.isFree = isFree;
      updateFields.pricePerDay = isFree ? 0 : dto.pricePerDay !== undefined ? Number(dto.pricePerDay) : service.pricePerDay;
    } else if (dto.pricePerDay !== undefined) {
      updateFields.pricePerDay = Number(dto.pricePerDay);
    }
    if (dto.location) updateFields.location = this.parseJsonField(dto.location, dto.location);
    if (dto.contact) updateFields.contact = this.parseJsonField(dto.contact, dto.contact);
    if (dto.tags) updateFields.tags = this.parseJsonField(dto.tags, dto.tags);
    if (dto.amenities) updateFields.amenities = this.parseJsonField(dto.amenities, dto.amenities);
    if (dto.timeSlots !== undefined) updateFields.timeSlots = this.parseJsonField(dto.timeSlots, dto.timeSlots);
    if (dto.customCategory !== undefined) updateFields.customCategory = dto.customCategory;
    if (dto.capacity) updateFields.capacity = Number(dto.capacity);
    if (dto.pricingUnit) updateFields.pricingUnit = dto.pricingUnit;
    if (dto.cancellationPolicy) updateFields.cancellationPolicy = dto.cancellationPolicy;
    if (dto.availableFrom) updateFields.availableFrom = new Date(dto.availableFrom);
    if (dto.availableTo) updateFields.availableTo = new Date(dto.availableTo);
    if (dto.bookingMode) updateFields.bookingMode = dto.bookingMode;
    if (dto.maxBookingsPerDay) updateFields.maxBookingsPerDay = Number(dto.maxBookingsPerDay);
    updateFields.images = [...keepImages, ...newImageUrls];

    const updated = await serviceRepository.updateById(id, updateFields as Partial<IService>);
    if (!updated) throw new NotFoundError('Service not found');
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    const service = await serviceRepository.findById(id);
    if (!service) throw new NotFoundError('Service not found');
    await serviceRepository.softDelete(id);
  }

  async getAvailableSlots(serviceId: string, date: string): Promise<{
    slots: SlotAvailability[];
    dailyStats: { bookings: number; guests: number };
  }> {
    if (!date) throw new NotFoundError('Query param ?date=YYYY-MM-DD is required');

    const service = await serviceRepository.findById(serviceId);
    if (!service || !service.isActive) throw new NotFoundError('Service not found');

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const existingBookings = await bookingRepository.findForSlotAvailability(serviceId, dayStart, dayEnd);

    let dailyBookingsCount = 0;
    let dailyGuestsCount = 0;
    const slotBookingCounts: Record<string, number> = {};

    for (const b of existingBookings) {
      dailyBookingsCount++;
      if (b.guestCount) dailyGuestsCount += b.guestCount;
      if (b.timeSlotId) {
        slotBookingCounts[b.timeSlotId] = (slotBookingCounts[b.timeSlotId] || 0) + 1;
      }
    }

    const slots: SlotAvailability[] =
      service.bookingMode === 'time_slot' && service.timeSlots?.length
        ? service.timeSlots
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
            })
        : [];

    return {
      slots,
      dailyStats: { bookings: dailyBookingsCount, guests: dailyGuestsCount },
    };
  }
}

export default new ServiceService();
