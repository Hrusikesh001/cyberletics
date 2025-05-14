import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import Tenant from '../models/Tenant';
import AuditLog from '../models/AuditLog';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import config from '../config/config';
import logger from '../utils/logger';
import { asyncHandler } from '../utils/errorHandler';
import { UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } from '../utils/errorHandler';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * AuthController handles all authentication related requests
 */
class AuthController {
  /**
   * Register a new user
   */
  public static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, tenantId } = req.body;

    // Validate input
    if (!email || !password || !name || !tenantId) {
      throw new BadRequestError('All fields are required');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('Email already in use');
    }

    // Validate tenant
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new BadRequestError('Invalid tenant');
    }

    // Check if tenant allows user registration
    if (!tenant.settings.allowUserRegistration) {
      throw new ForbiddenError('User registration is disabled for this tenant');
    }

    // Check if tenant has reached user limit
    const userCount = await User.countDocuments({ 'tenants.tenantId': tenantId });
    if (await Tenant.hasReachedUserLimit(tenantId, userCount)) {
      throw new ForbiddenError('Maximum number of users reached for this tenant');
    }

    // Create new user
    const user = new User({
      email,
      password, // Will be hashed by the pre-save hook
      name,
      role: 'user', // Default role
      tenants: [{ tenantId, role: 'user' }] // Add user to tenant with default role
    });

    // Save the user
    await user.save();

    // Log the event
    await AuditLog.createLog({
      tenantId,
      userId: user._id,
      eventType: 'user_created',
      resourceType: 'user',
      resourceId: user._id.toString(),
      description: `User ${user.name} (${user.email}) was created`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`User registered: ${user.email}`, { userId: user._id, tenantId });

    // Return success without sensitive data
    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  });

  /**
   * Login a user
   */
  public static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      // Log failed login attempt
      await AuditLog.createLog({
        tenantId: new mongoose.Types.ObjectId(), // Placeholder since no tenant yet
        userId: new mongoose.Types.ObjectId(), // Placeholder since no user found
        eventType: 'failed_login',
        resourceType: 'auth',
        description: `Failed login attempt for ${email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      logger.warn(`Failed login attempt for non-existent user: ${email}`, { ip: req.ip });
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn(`Login attempt for inactive account: ${email}`, { userId: user._id });
      throw new ForbiddenError('Account is deactivated');
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log failed login attempt for existing user
      await AuditLog.createLog({
        tenantId: user.tenants[0]?.tenantId || new mongoose.Types.ObjectId(),
        userId: user._id,
        eventType: 'failed_login',
        resourceType: 'auth',
        description: `Failed login attempt for user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      logger.warn(`Failed login attempt (wrong password): ${email}`, { userId: user._id, ip: req.ip });
      throw new UnauthorizedError('Invalid credentials');
    }

    // Get user's tenants with details
    const userTenants = await Tenant.find({
      _id: { $in: user.tenants.map(t => t.tenantId) },
      status: 'active'
    }).select('_id name displayName logoUrl');

    if (userTenants.length === 0) {
      logger.warn(`Login attempt for user with no active tenants: ${email}`, { userId: user._id });
      throw new ForbiddenError('No active tenants available for this user');
    }

    // Set default tenant as the first available
    const defaultTenantId = userTenants[0]._id.toString();

    // Generate JWT token with the default tenant
    const token = user.generateAuthToken(defaultTenantId);

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await AuditLog.createLog({
      tenantId: defaultTenantId,
      userId: user._id,
      eventType: 'login',
      resourceType: 'auth',
      description: `User ${user.email} logged in`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`User logged in: ${user.email}`, { userId: user._id, tenantId: defaultTenantId });

    // Return token and user info
    return res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tenants: userTenants.map(tenant => ({
          id: tenant._id,
          name: tenant.name,
          displayName: tenant.displayName,
          logoUrl: tenant.logoUrl
        }))
      }
    });
  });

  /**
   * Get current user info
   */
  public static me = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const tenantId = (req as any).tenantId;

    // Find user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get user's tenants with details
    const userTenants = await Tenant.find({
      _id: { $in: user.tenants.map(t => t.tenantId) },
      status: 'active'
    }).select('_id name displayName logoUrl');

    // Return user info
    return res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tenants: userTenants.map(tenant => ({
          id: tenant._id,
          name: tenant.name,
          displayName: tenant.displayName,
          logoUrl: tenant.logoUrl
        }))
      }
    });
  });

  /**
   * Change password
   */
  public static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const tenantId = (req as any).tenantId;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Current password and new password are required');
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters long');
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Compare current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword; // Will be hashed by the pre-save hook
    await user.save();

    // Log password change
    await AuditLog.createLog({
      tenantId,
      userId: user._id,
      eventType: 'password_change',
      resourceType: 'user',
      resourceId: user._id.toString(),
      description: `Password changed for user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`Password changed for user: ${user.email}`, { userId: user._id, tenantId });

    return res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  });

  /**
   * Logout user
   */
  public static logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const tenantId = (req as any).tenantId;

    // Log logout
    await AuditLog.createLog({
      tenantId,
      userId,
      eventType: 'logout',
      resourceType: 'auth',
      description: 'User logged out',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info('User logged out', { userId, tenantId });

    // Note: JWT tokens are stateless, so we can't invalidate them server-side
    // Client should remove the token from storage
    return res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  });

  /**
   * Request password reset
   */
  public static requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    // Validate input
    if (!email) {
      throw new BadRequestError('Email is required');
    }

    // Find user
    const user = await User.findOne({ email });
    
    // Always return a success response even if user doesn't exist (security best practice)
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return res.json({
        status: 'success',
        message: 'If your email is registered, you will receive a password reset link shortly'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id }, 
      config.jwt.secret, 
      { expiresIn: '1h' }
    );

    // In a real app, you would:
    // 1. Store the reset token in the database with an expiration
    // 2. Send an email with a link containing the token

    logger.info(`Password reset requested for: ${email}`, { userId: user._id });

    // For demo purposes, just return the token
    return res.json({
      status: 'success',
      message: 'If your email is registered, you will receive a password reset link shortly',
      resetToken // Remove this in production
    });
  });

  /**
   * Reset password
   */
  public static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      throw new BadRequestError('Token and new password are required');
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters long');
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as any;
    } catch (error) {
      throw new BadRequestError('Invalid or expired token');
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update password
    user.password = newPassword; // Will be hashed by the pre-save hook
    await user.save();

    // Log password reset
    await AuditLog.createLog({
      tenantId: user.tenants[0]?.tenantId || new mongoose.Types.ObjectId(),
      userId: user._id,
      eventType: 'password_change',
      resourceType: 'user',
      resourceId: user._id.toString(),
      description: `Password reset for user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`Password reset completed for: ${user.email}`, { userId: user._id });

    return res.json({
      status: 'success',
      message: 'Password reset successfully'
    });
  });
}

export default AuthController; 