import { Types } from 'mongoose';
import { IUser } from '../../models/User';

export interface IUserRepository {
  findById(id: string | Types.ObjectId): Promise<IUser | null>;
  findByIdWithPassword(id: string | Types.ObjectId): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByEmailWithPassword(email: string): Promise<IUser | null>;
  create(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<IUser>;
  findAll(
    filter: Record<string, unknown>,
    skip: number,
    limit: number
  ): Promise<[IUser[], number]>;
  findIdsByRegex(regex: RegExp): Promise<Types.ObjectId[]>;
}
