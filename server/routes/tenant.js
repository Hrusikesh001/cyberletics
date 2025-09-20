const express = require('express');
const asyncHandler = require('express-async-handler');
const { localDB } = require('../db');
const authenticateJWT = require('../middlewares/auth');

const router = express.Router();

// Get tenant-specific data (name, branding, etc.)
router.get('/data', authenticateJWT, asyncHandler(async (req, res) => {
  const tenant = localDB.findTenantById(req.user.tenantId);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json({
    id: tenant.id,
    name: tenant.name,
    branding: {
      logo: '/cyberletics-logo.png', // Placeholder
      color: '#2563eb', // Placeholder
    }
  });
}));

module.exports = router; 