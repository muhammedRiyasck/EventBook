import { Router } from 'express';
import { protect, isAdmin } from '../middleware/auth';
import { getUsers } from '../controllers/adminController';

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, isAdmin);

// GET /api/admin/users?page=1&limit=20&search=john&role=user
router.get('/users', getUsers);

export default router;
