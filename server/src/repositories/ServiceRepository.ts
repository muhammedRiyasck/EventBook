import { Types } from 'mongoose';
import Service, { IService } from '../models/Service';
import { GetServicesQueryDto } from '../dto/service.dto';
import { IServiceRepository } from './interfaces/IServiceRepository';

type SortOption = Record<string, 1 | -1>;

/**
 * ServiceRepository — all Mongoose queries for the Service collection.
 */
export class ServiceRepository implements IServiceRepository {
  async findById(id: string): Promise<IService | null> {
    return Service.findById(id);
  }

  async findByIdPopulated(id: string): Promise<IService | null> {
    return Service.findById(id).populate('createdBy', 'name email');
  }

  async findActive(id: string): Promise<IService | null> {
    return Service.findOne({ _id: id, isActive: true });
  }

  async create(data: Record<string, unknown>): Promise<IService> {
    return Service.create(data);
  }

  async updateById(
    id: string,
    updateFields: Partial<IService>
  ): Promise<IService | null> {
    return Service.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });
  }

  async softDelete(id: string): Promise<IService | null> {
    return Service.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  /**
   * Atomically reserve a date range on a service.
   * Returns null if the dates are already booked (used for race-condition prevention).
   */
  async atomicReserveDates(
    serviceId: string,
    start: Date,
    end: Date
  ): Promise<IService | null> {
    return Service.findOneAndUpdate(
      {
        _id: serviceId,
        isActive: true,
        availability: {
          $not: {
            $elemMatch: {
              isBooked: true,
              startDate: { $lt: end },
              endDate: { $gt: start },
            },
          },
        },
      },
      {
        $push: {
          availability: { startDate: start, endDate: end, isBooked: true },
        },
      },
      { new: true }
    );
  }

  /** Rollback a previously reserved date window (e.g. when booking creation fails). */
  async rollbackReservedDates(serviceId: string, start: Date, end: Date): Promise<void> {
    await Service.findByIdAndUpdate(serviceId, {
      $pull: { availability: { startDate: start, endDate: end, isBooked: true } },
    });
  }

  /** Free up a date window when a booking is cancelled. */
  async freeAvailabilityWindow(serviceId: string, start: Date, end: Date): Promise<void> {
    const service = await Service.findById(serviceId);
    if (!service) return;
    service.availability = service.availability.filter((window) => {
      const sameStart = new Date(window.startDate).getTime() === new Date(start).getTime();
      const sameEnd = new Date(window.endDate).getTime() === new Date(end).getTime();
      return !(sameStart && sameEnd && window.isBooked);
    });
    await service.save();
  }

  async findMany(
    query: GetServicesQueryDto
  ): Promise<[IService[], number]> {
    const {
      page = '1', limit = '12', sort = 'newest',
      category, city, minPrice, maxPrice,
      startDate, endDate, search, bookingMode, includeInactive,
    } = query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter: Record<string, unknown> = {};

    if (includeInactive !== 'true') {
      filter.isActive = true;
      filter.$or = [
        { availableTo: { $exists: false } },
        { availableTo: null },
        { availableTo: { $gte: today } },
      ];
    }

    if (category && category !== 'all') filter.category = category;
    if (bookingMode && bookingMode !== 'all') filter.bookingMode = bookingMode;
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };

    if (search?.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      const searchConditions = [
        { title: searchRegex },
        { description: searchRegex },
        { 'location.city': searchRegex },
        { tags: searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      filter.pricePerDay = priceFilter;
    }

    if (startDate && endDate) {
      filter['availability'] = {
        $not: {
          $elemMatch: {
            isBooked: true,
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) },
          },
        },
      };
    }

    const sortOptions: Record<string, SortOption> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { pricePerDay: 1 },
      price_desc: { pricePerDay: -1 },
      rating_desc: { rating: -1 },
      title: { title: 1 },
    };
    const selectedSort = sortOptions[sort] ?? sortOptions.newest;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    return Promise.all([
      Service.find(filter).sort(selectedSort).skip(skip).limit(limitNum).populate('createdBy', 'name email'),
      Service.countDocuments(filter),
    ]);
  }

  async findIdsByRegex(regex: RegExp): Promise<Types.ObjectId[]> {
    const services = await Service.find({ title: regex }).select('_id');
    return services.map((s) => s._id as Types.ObjectId);
  }
}

export default new ServiceRepository();
