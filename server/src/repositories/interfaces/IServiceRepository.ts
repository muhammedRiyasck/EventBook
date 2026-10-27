import { Types } from 'mongoose';
import { IService } from '../../models/Service';
import { GetServicesQueryDto } from '../../dto/service.dto';

export interface IServiceRepository {
  findById(id: string): Promise<IService | null>;
  findByIdPopulated(id: string): Promise<IService | null>;
  findActive(id: string): Promise<IService | null>;
  create(data: Record<string, unknown>): Promise<IService>;
  updateById(id: string, updateFields: Partial<IService>): Promise<IService | null>;
  softDelete(id: string): Promise<IService | null>;
  atomicReserveDates(serviceId: string, start: Date, end: Date): Promise<IService | null>;
  rollbackReservedDates(serviceId: string, start: Date, end: Date): Promise<void>;
  freeAvailabilityWindow(serviceId: string, start: Date, end: Date): Promise<void>;
  findMany(query: GetServicesQueryDto): Promise<[IService[], number]>;
  findIdsByRegex(regex: RegExp): Promise<Types.ObjectId[]>;
}
