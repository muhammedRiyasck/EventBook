import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { BadRequestError } from '../errors/AppError';
import serviceService from '../services/ServiceService';
import { AuthRequest } from '../middleware/auth';

/**
 * ServiceController —  HTTP adapter for service operations.
 */

export const getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await serviceService.getServices(req.query as never);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await serviceService.getServiceById(req.params.id as string);
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.query.date) throw new BadRequestError('Query param ?date=YYYY-MM-DD is required');
    const result = await serviceService.getAvailableSlots(req.params.id as string, req.query.date as string);
    res.status(200).json({ success: true, data: result.slots, dailyStats: result.dailyStats });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new BadRequestError(errors.array()[0].msg as string);

    const files = req.files as Express.Multer.File[] | undefined;
    const service = await serviceService.createService(req.user!, req.body, files);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new BadRequestError(errors.array()[0].msg as string);

    const files = req.files as Express.Multer.File[] | undefined;
    const service = await serviceService.updateService(req.params.id as string, req.body, files);
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await serviceService.deleteService(req.params.id as string);
    res.status(200).json({ success: true, message: 'Service removed successfully' });
  } catch (error) {
    next(error);
  }
};
