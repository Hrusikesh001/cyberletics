import { Router } from 'express';
import TenantController from '../controllers/TenantController';
import { verifyToken, requireRole, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// All tenant routes require authentication
router.use(verifyToken);

// Tenant management routes
router.post('/', TenantController.create);
router.get('/', requireSuperAdmin, TenantController.getAll);
router.get('/:id', TenantController.getById);
router.put('/:id', requireRole('admin'), TenantController.update);
router.patch('/:id/status', requireSuperAdmin, TenantController.changeStatus);

// Tenant user management
router.get('/:id/users', TenantController.getUsers);
router.post('/:id/users', requireRole('admin'), TenantController.addUser);
router.delete('/:id/users/:userId', requireRole('admin'), TenantController.removeUser);
router.put('/:id/users/:userId/role', requireRole('admin'), TenantController.updateUserRole);

export default router; 