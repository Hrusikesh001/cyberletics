import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Tenant from '../models/Tenant';
import AuditLog from '../models/AuditLog';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Interface for JWT payload
 */
interface JwtPayload {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tenantId: string;
  iat: number;
  exp: number;
}

/**
 * Custom request interface with user and tenant information
 */
export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenants?: { tenantId: string; role: string }[];
  };
  tenantId: string;
}

/**
 * Middleware to verify JWT token and add user and tenant context to request
 */
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Extract tenant ID from headers or default to the one in JWT
    const tenantId = req.headers['x-tenant-id'] as string || decoded.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }
    
    // Find user and verify they exist
    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    
    // Find tenant and verify it exists and is active
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    if (tenant.status !== 'active') {
      return res.status(403).json({ message: 'Tenant is not active' });
    }
    
    // Verify user has access to this tenant
    const hasAccess = user.tenants.some(t => t.tenantId.toString() === tenantId);
    if (!hasAccess) {
      // Log unauthorized access attempt
      await AuditLog.create({
        tenantId,
        userId: user._id,
        eventType: 'failed_login',
        resourceType: 'auth',
        description: `User ${user.email} attempted to access unauthorized tenant`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(403).json({ message: 'You do not have access to this tenant' });
    }
    
    // Add user info to request
    (req as AuthRequest).user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      tenants: user.tenants
    };
    
    // Add tenant ID to request
    (req as AuthRequest).tenantId = tenantId;
    
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to require specific tenant role
 */
export const requireRole = (role: 'admin' | 'user') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const tenantId = authReq.tenantId;
    const user = authReq.user;
    
    // Super admins can do anything
    if (user.role === 'super-admin') {
      return next();
    }
    
    // Check user's role in the specific tenant
    const tenantRole = user.tenants?.find(t => t.tenantId.toString() === tenantId)?.role;
    
    if (role === 'admin' && tenantRole !== 'admin') {
      return res.status(403).json({ message: 'Admin role required' });
    }
    
    next();
  };
};

/**
 * Middleware to require super admin role
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  
  if (authReq.user.role !== 'super-admin') {
    return res.status(403).json({ message: 'Super admin role required' });
  }
  
  next();
}; 