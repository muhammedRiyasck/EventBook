import User, { IUser } from '../models/User';
import { Types } from 'mongoose';

/**
 * UserRepository — all Mongoose queries for the User collection live here.
 * Controllers and services never import the User model directly.
 */
export class UserRepository {
  async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByIdWithPassword(id: string | Types.ObjectId): Promise<IUser | null> {
    return User.findById(id).select('+password');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+password');
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<IUser> {
    return User.create(data);
  }

  async findAll(filter: Record<string, unknown>, skip: number, limit: number) {
    return Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
  }
}

export default new UserRepository();
