const express = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { localDB } = require('../db');
const { JWT_SECRET } = require('../config');
const authenticateJWT = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

const router = express.Router();

// Helper: generate JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Tenant registration (onboarding)
router.post('/register-tenant', asyncHandler(async (req, res) => {
  const { tenantName, email, password } = req.body;
  if (!tenantName || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  // Check if user already exists
  const existingUser = localDB.findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  // Create tenant
  const tenant = localDB.addTenant({ name: tenantName });
  
  // Create admin user
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = localDB.addUser({
    email,
    password: hashedPassword,
    tenantId: tenant.id,
    role: 'admin',
  });
  
  const token = generateToken(user);
  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
    tenant: {
      id: tenant.id,
      name: tenant.name,
    }
  });
}));

// User login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = localDB.findUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  
  const tenant = localDB.findTenantById(user.tenantId);
  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
    tenant: tenant ? { id: tenant.id, name: tenant.name } : null
  });
}));

// Admin invites a user (creates user with invite)
router.post('/invite', authenticateJWT, requireRole('admin'), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  // Check if user already exists
  const existingUser = localDB.findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  // Only allow invite within same tenant
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = localDB.addUser({
    email,
    password: hashedPassword,
    tenantId: req.user.tenantId,
    role: 'user',
  });
  
  // In a real app, send invite email here
  res.status(201).json({ message: 'User invited', userId: user.id });
}));

// Get current user and tenant info
router.get('/me', authenticateJWT, asyncHandler(async (req, res) => {
  const user = localDB.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const tenant = localDB.findTenantById(user.tenantId);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
    tenant: tenant ? { id: tenant.id, name: tenant.name } : null
  });
}));

module.exports = router; 