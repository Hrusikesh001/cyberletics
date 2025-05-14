import { Request, Response } from 'express';
import Tenant, { ITenant } from '../models/Tenant';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import mongoose from 'mongoose';

/**
 * TenantController handles all tenant related requests
 */
class TenantController {
  /**
   * Create a new tenant
   */
  public static async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const { name, displayName, domain, settings } = req.body;

      // Validate input
      if (!name || !displayName || !settings?.gophishApiKey || !settings?.emailFrom) {
        return res.status(400).json({ message: 'Name, display name, Gophish API key, and email from are required' });
      }

      // Validate name format (only lowercase letters, numbers, and hyphens)
      if (!/^[a-z0-9-]+$/.test(name)) {
        return res.status(400).json({ message: 'Tenant name can only contain lowercase letters, numbers, and hyphens' });
      }

      // Check if name already exists
      const existingTenant = await Tenant.findOne({ name });
      if (existingTenant) {
        return res.status(400).json({ message: 'Tenant name already in use' });
      }

      // Create new tenant
      const tenant = new Tenant({
        name,
        displayName,
        domain,
        settings: {
          gophishApiKey: settings.gophishApiKey,
          gophishApiUrl: settings.gophishApiUrl || 'https://localhost:3333/api',
          emailFrom: settings.emailFrom,
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          allowUserRegistration: settings.allowUserRegistration || false,
          maxUsers: settings.maxUsers || 5,
          maxCampaigns: settings.maxCampaigns || 10,
          allowedTemplates: settings.allowedTemplates || []
        },
        status: 'pending' // Default status
      });

      // Save the tenant
      await tenant.save();

      // Add tenant to the creating user with admin role
      await User.findByIdAndUpdate(
        userId,
        { 
          $push: { 
            tenants: { 
              tenantId: tenant._id, 
              role: 'admin' 
            } 
          } 
        }
      );

      // Log the event
      await AuditLog.create({
        tenantId: tenant._id,
        userId,
        eventType: 'tenant_created',
        resourceType: 'tenant',
        resourceId: tenant._id.toString(),
        description: `Tenant "${tenant.displayName}" was created`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Return success
      return res.status(201).json({
        message: 'Tenant created successfully',
        tenant: {
          id: tenant._id,
          name: tenant.name,
          displayName: tenant.displayName,
          status: tenant.status
        }
      });
    } catch (error: any) {
      console.error('Error in createTenant:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  /**
   * Get all tenants (for super admins)
   */
  public static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const userRole = (req as any).user.role;

      // Ensure user is super-admin
      if (userRole !== 'super-admin') {
        return res.status(403).json({ message: 'Unauthorized. Requires super-admin role.' });
      }

      // Get all tenants
      const tenants = await Tenant.find()
        .select('_id name displayName status plan domain createdAt')
        .sort({ createdAt: -1 });

      return res.json(tenants);
    } catch (error: any) {
      console.error('Error in getAllTenants:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  /**
   * Get tenant by ID
   */
  public static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.params.id;
      const userRole = (req as any).user.role;
      const userTenants = (req as any).user.tenants || [];

      // Validate that user has access to this tenant
      const hasAccess = userRole === 'super-admin' || userTenants.some((t: any) => t.tenantId.toString() === tenantId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Unauthorized access to this tenant' });
      }

      // Get tenant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // If not super-admin, remove sensitive fields
      let tenantData = tenant.toObject();
      if (userRole !== 'super-admin') {
        delete tenantData.settings.gophishApiKey;
        delete tenantData.billingInfo;
        delete tenantData.subscription;
      }

      return res.json(tenantData);
    } catch (error: any) {
      console.error('Error in getTenantById:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  /**
   * Update tenant
   */
  public static async update(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.params.id;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const userTenants = (req as any).user.tenants || [];

      // Validate that user has admin access to this tenant
      const isAdmin = userRole === 'super-admin' || 
        userTenants.some((t: any) => t.tenantId.toString() === tenantId && t.role === 'admin');
      
      if (!isAdmin) {
        return res.status(403).json({ message: 'Unauthorized. Requires admin role for this tenant.' });
      }

      // Find tenant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Update allowed fields
      const updateData: Partial<ITenant> = {};
      
      // Basic information can be updated by tenant admins
      if (req.body.displayName) updateData.displayName = req.body.displayName;
      if (req.body.domain) updateData.domain = req.body.domain;
      if (req.body.logoUrl) updateData.logoUrl = req.body.logoUrl;
      
      // Settings update
      if (req.body.settings) {
        updateData.settings = {
          ...tenant.settings,
          ...req.body.settings
        };
      }
      
      // Only super-admin can update these fields
      if (userRole === 'super-admin') {
        if (req.body.status) updateData.status = req.body.status;
        if (req.body.plan) updateData.plan = req.body.plan;
        if (req.body.billingInfo) updateData.billingInfo = req.body.billingInfo;
        if (req.body.subscription) updateData.subscription = req.body.subscription;
      }

      // Update tenant
      const updatedTenant = await Tenant.findByIdAndUpdate(
        tenantId,
        { $set: updateData },
        { new: true }
      );

      // Log the event
      await AuditLog.create({
        tenantId,
        userId,
        eventType: 'tenant_updated',
        resourceType: 'tenant',
        resourceId: tenantId,
        description: `Tenant "${tenant.displayName}" was updated`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { changes: updateData }
      });

      return res.json({
        message: 'Tenant updated successfully',
        tenant: updatedTenant
      });
    } catch (error: any) {
      console.error('Error in updateTenant:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  /**
   * Change tenant status
   */
  public static async changeStatus(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.params.id;
      const { status } = req.body;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      // Only super-admin can change tenant status
      if (userRole !== 'super-admin') {
        return res.status(403).json({ message: 'Unauthorized. Requires super-admin role.' });
      }

      // Validate status
      if (!status || !['active', 'suspended', 'pending'].includes(status)) {
        return res.status(400).json({ message: 'Valid status (active, suspended, pending) is required' });
      }

      // Update tenant status
      const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        { status },
        { new: true }
      );

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Log the event
      await AuditLog.create({
        tenantId,
        userId,
        eventType: 'tenant_updated',
        resourceType: 'tenant',
        resourceId: tenantId,
        description: `Tenant "${tenant.displayName}" status changed to ${status}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        message: 'Tenant status updated successfully',
        tenant: {
          id: tenant._id,
          name: tenant.name,
          displayName: tenant.displayName,
          status: tenant.status
        }
      });
    } catch (error: any) {
      console.error('Error in changeTenantStatus:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  /**
   * Get tenant users
   */
  public static async getUsers(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.params.id;
      const userRole = (req as any).user.role;
      const userTenants = (req as any).user.tenants || [];

      // Validate that user has access to this tenant
      const hasAccess = userRole === 'super-admin' || 
        userTenants.some((t: any) => t.tenantId.toString() === tenantId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Unauthorized access to this tenant' });
      }

      // Get users for tenant (exclude password)
      const users = await User.find({ 'tenants.tenantId': tenantId })
        .select('_id email name role tenants lastLogin isActive createdAt')
        .sort({ createdAt: -1 });

      // Filter tenant specific role for each user
      const tenantUsers = users.map(user => {
        const userObj = user.toObject();
        const tenantRole = user.tenants.find((t: any) => 
          t.tenantId.toString() === tenantId
        )?.role || 'user';
        
        return {
          ...userObj,
          tenantRole
        };
      });

      return res.json(tenantUsers);
    } catch (error: any) {
      console.error('Error in getTenantUsers:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  /**
   * Add user to tenant
   */
  public static async addUser(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.params.id;
      const { email, role = 'user' } = req.body;
      const requestingUserId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const userTenants = (req as any).user.tenants || [];

      // Validate that user has admin access to this tenant
      const isAdmin = userRole === 'super-admin' || 
        userTenants.some((t: any) => t.tenantId.toString() === tenantId && t.role === 'admin');
      
      if (!isAdmin) {
        return res.status(403).json({ message: 'Unauthorized. Requires admin role for this tenant.' });
      }

      // Validate input
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Validate role
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: 'Valid role (admin, user) is required' });
      }

      // Find tenant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Check if tenant is active
      if (tenant.status !== 'active') {
        return res.status(400).json({ message: 'Cannot add users to inactive tenant' });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user already belongs to this tenant
      const alreadyInTenant = user.tenants.some((t: any) => t.tenantId.toString() === tenantId);
      if (alreadyInTenant) {
        return res.status(400).json({ message: 'User already belongs to this tenant' });
      }

      // Check if tenant has reached user limit
      const userCount = await User.countDocuments({ 'tenants.tenantId': tenantId });
      if (tenant.settings.maxUsers && userCount >= tenant.settings.maxUsers) {
        return res.status(403).json({ message: 'Maximum number of users reached for this tenant' });
      }

      // Add tenant to user
      await User.findByIdAndUpdate(
        user._id,
        { 
          $push: { 
            tenants: { 
              tenantId, 
              role 
            } 
          } 
        }
      );

      // Log the event
      await AuditLog.create({
        tenantId,
        userId: requestingUserId,
        eventType: 'user_updated',
        resourceType: 'user',
        resourceId: user._id.toString(),
        description: `User ${user.email} was added to tenant "${tenant.displayName}" with role ${role}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        message: 'User added to tenant successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantRole: role
        }
      });
    } catch (error: any) {
      console.error('Error in addUserToTenant:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  /**
   * Remove user from tenant
   */
  public static async removeUser(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.params.id;
      const userId = req.params.userId;
      const requestingUserId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const userTenants = (req as any).user.tenants || [];

      // Validate that user has admin access to this tenant
      const isAdmin = userRole === 'super-admin' || 
        userTenants.some((t: any) => t.tenantId.toString() === tenantId && t.role === 'admin');
      
      if (!isAdmin) {
        return res.status(403).json({ message: 'Unauthorized. Requires admin role for this tenant.' });
      }

      // Find tenant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user belongs to this tenant
      const userBelongsToTenant = user.tenants.some((t: any) => t.tenantId.toString() === tenantId);
      if (!userBelongsToTenant) {
        return res.status(400).json({ message: 'User does not belong to this tenant' });
      }

      // Prevent removing the last admin
      if (user.tenants.find((t: any) => t.tenantId.toString() === tenantId)?.role === 'admin') {
        const adminCount = await User.countDocuments({ 
          'tenants': { 
            $elemMatch: { 
              tenantId: new mongoose.Types.ObjectId(tenantId), 
              role: 'admin' 
            } 
          } 
        });
        
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'Cannot remove the last admin from tenant' });
        }
      }

      // Prevent removing yourself
      if (userId === requestingUserId) {
        return res.status(400).json({ message: 'Cannot remove yourself from tenant' });
      }

      // Remove tenant from user
      await User.findByIdAndUpdate(
        userId,
        { 
          $pull: { 
            tenants: { 
              tenantId
            } 
          } 
        }
      );

      // Log the event
      await AuditLog.create({
        tenantId,
        userId: requestingUserId,
        eventType: 'user_updated',
        resourceType: 'user',
        resourceId: userId,
        description: `User ${user.email} was removed from tenant "${tenant.displayName}"`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        message: 'User removed from tenant successfully'
      });
    } catch (error: any) {
      console.error('Error in removeUserFromTenant:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  /**
   * Update user's role in tenant
   */
  public static async updateUserRole(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.params.id;
      const userId = req.params.userId;
      const { role } = req.body;
      const requestingUserId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const userTenants = (req as any).user.tenants || [];

      // Validate that user has admin access to this tenant
      const isAdmin = userRole === 'super-admin' || 
        userTenants.some((t: any) => t.tenantId.toString() === tenantId && t.role === 'admin');
      
      if (!isAdmin) {
        return res.status(403).json({ message: 'Unauthorized. Requires admin role for this tenant.' });
      }

      // Validate role
      if (!role || !['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: 'Valid role (admin, user) is required' });
      }

      // Find tenant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user belongs to this tenant
      const tenantIndex = user.tenants.findIndex((t: any) => t.tenantId.toString() === tenantId);
      if (tenantIndex === -1) {
        return res.status(400).json({ message: 'User does not belong to this tenant' });
      }

      // Prevent demoting yourself from admin
      if (userId === requestingUserId && role !== 'admin' && 
          user.tenants[tenantIndex].role === 'admin') {
        return res.status(400).json({ message: 'Cannot demote yourself from admin role' });
      }

      // Prevent demoting the last admin
      if (user.tenants[tenantIndex].role === 'admin' && role !== 'admin') {
        const adminCount = await User.countDocuments({ 
          'tenants': { 
            $elemMatch: { 
              tenantId: new mongoose.Types.ObjectId(tenantId), 
              role: 'admin' 
            } 
          } 
        });
        
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'Cannot demote the last admin' });
        }
      }

      // Update user role
      await User.updateOne(
        { 
          _id: userId, 
          'tenants.tenantId': tenantId 
        },
        { 
          $set: { 
            'tenants.$.role': role 
          } 
        }
      );

      // Log the event
      await AuditLog.create({
        tenantId,
        userId: requestingUserId,
        eventType: 'role_changed',
        resourceType: 'user',
        resourceId: userId,
        description: `User ${user.email} role was changed to ${role} in tenant "${tenant.displayName}"`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        message: 'User role updated successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          tenantRole: role
        }
      });
    } catch (error: any) {
      console.error('Error in updateUserRole:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

export default TenantController; 