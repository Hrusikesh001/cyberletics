import { Router } from 'express';
import BillingController from '../controllers/BillingController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// All billing routes require authentication except webhook
router.post('/create-customer', verifyToken, BillingController.createCustomer);
router.post('/create-or-update-subscription', verifyToken, BillingController.createOrUpdateSubscription);
router.get('/customer-portal', verifyToken, BillingController.getCustomerPortal);
// Stripe webhook (no auth)
router.post('/webhook', BillingController.handleWebhook);

export default router; 