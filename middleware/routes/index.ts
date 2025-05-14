import { Router } from 'express';
import authRoutes from './authRoutes';
import tenantRoutes from './tenantRoutes';
import userRoutes from './userRoutes';
import trainingRoutes from './trainingRoutes';
import reportRoutes from './reportRoutes';
import webhookRoutes from './webhookRoutes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/users', userRoutes);
router.use('/training', trainingRoutes);
router.use('/reports', reportRoutes);
router.use('/webhooks', webhookRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

export default router; 