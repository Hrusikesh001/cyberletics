import { Router } from 'express';
import AuditLog from '../models/AuditLog';
import { verifyToken, requireRole } from '../middleware/auth';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import sanitize from './middleware/sanitize';
import DOMPurify from 'dompurify';
import User from '../models/User';

const router = Router();

// GET /api/audit-logs
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { userId, eventType, startDate, endDate, limit } = req.query;
    let logs;
    if (userId) {
      logs = await (AuditLog as any).getUserLogs(tenantId, userId as string, Number(limit) || 50);
    } else if (eventType) {
      logs = await (AuditLog as any).getEventLogs(tenantId, eventType as string, Number(limit) || 50);
    } else if (startDate && endDate) {
      logs = await (AuditLog as any).searchByDateRange(
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string),
        Number(limit) || 100
      );
    } else {
      logs = await (AuditLog as any).getRecentLogs(tenantId, Number(limit) || 100);
    }
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error: err.message });
  }
});

router.post('/consent', verifyToken, async (req, res) => {
  const { cookies, privacyPolicy } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, {
    consent: { cookies, privacyPolicy, consentDate: new Date() }
  }, { new: true });
  res.json({ consent: user.consent });
});

router.delete('/me', verifyToken, async (req, res) => {
  // Remove user and all their data for this tenant
  await User.deleteOne({ _id: req.user.id, 'tenants.tenantId': req.tenantId });
  // Optionally, cascade delete related data (campaigns, logs, etc.)
  res.json({ message: 'Account and data deleted.' });
});

router.get('/me/export', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  // Fetch related data as needed
  res.json({ user });
});

export default router; 