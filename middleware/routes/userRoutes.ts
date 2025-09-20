import { Router } from 'express';
import { verifyToken, requireRole, requireSuperAdmin } from '../middleware/auth';
import User from '../models/User';
import AuditLog from '../models/AuditLog';

const router = Router();

// All user routes require authentication
router.use(verifyToken);

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Get user without password
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json(user);
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update current user profile
router.put('/profile', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const tenantId = (req as any).tenantId;
    const { name, email } = req.body;
    
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is changed and already exists
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update user
    user.name = name;
    user.email = email;
    await user.save();
    
    // Log the event
    await AuditLog.create({
      tenantId,
      userId,
      eventType: 'user_updated',
      resourceType: 'user',
      resourceId: userId,
      description: 'User profile updated',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Super admin routes
// List all users (super admin only)
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const userRole = (req as any).user.role;
    const tenantId = (req as any).tenantId;
    let users;
    if (userRole === 'super-admin') {
      users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 });
    } else {
      users = await User.find({ 'tenants.tenantId': tenantId })
        .select('-password')
        .sort({ createdAt: -1 });
    }
    return res.json(users);
  } catch (error: any) {
    console.error('Error listing users:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user by ID (super admin only)
router.get('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json(user);
  } catch (error: any) {
    console.error('Error getting user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user (super admin only)
router.put('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const superAdminId = (req as any).user.id;
    
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is changed and already exists
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update user
    user.name = name;
    user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    await user.save();
    
    // Log the event
    await AuditLog.create({
      tenantId: user.tenants[0]?.tenantId,
      userId: superAdminId,
      eventType: 'user_updated',
      resourceType: 'user',
      resourceId: user._id.toString(),
      description: `User ${user.email} was updated by super admin`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (super admin only)
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const superAdminId = (req as any).user.id;
    
    // Prevent deleting yourself
    if (req.params.id === superAdminId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deleting the last super admin
    if (user.role === 'super-admin') {
      const superAdminCount = await User.countDocuments({ role: 'super-admin' });
      if (superAdminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last super admin' });
      }
    }
    
    // Log the event before deletion
    await AuditLog.create({
      tenantId: user.tenants[0]?.tenantId,
      userId: superAdminId,
      eventType: 'user_deleted',
      resourceType: 'user',
      resourceId: user._id.toString(),
      description: `User ${user.email} was deleted by super admin`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);
    
    return res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 