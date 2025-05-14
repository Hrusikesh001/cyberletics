import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth';
import TrainingModule from '../models/TrainingModule';
import UserProgress from '../models/UserProgress';

const router = Router();

// All training routes require authentication
router.use(verifyToken);

// Get all training modules for current tenant
router.get('/modules', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    
    // Get published modules for tenant
    const modules = await TrainingModule.find({ tenantId, published: true })
      .sort({ featured: -1, createdAt: -1 });
    
    return res.json(modules);
  } catch (error: any) {
    console.error('Error fetching training modules:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific module
router.get('/modules/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const moduleId = req.params.id;
    
    // Get module
    const module = await TrainingModule.findOne({ _id: moduleId, tenantId });
    if (!module) {
      return res.status(404).json({ message: 'Training module not found' });
    }
    
    return res.json(module);
  } catch (error: any) {
    console.error('Error fetching training module:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's progress for all modules
router.get('/progress', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    
    // Get user's progress
    const progress = await UserProgress.find({ userId, tenantId })
      .sort({ updatedAt: -1 });
    
    return res.json(progress);
  } catch (error: any) {
    console.error('Error fetching training progress:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user's progress for a module
router.post('/progress', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const { moduleId, score, completed, answers, timeSpent } = req.body;
    
    // Validate input
    if (!moduleId || score === undefined || completed === undefined) {
      return res.status(400).json({ message: 'Module ID, score, and completion status are required' });
    }
    
    // Verify module exists
    const module = await TrainingModule.findOne({ _id: moduleId, tenantId });
    if (!module) {
      return res.status(404).json({ message: 'Training module not found' });
    }
    
    // Create progress data
    const progressData = {
      userId,
      tenantId,
      moduleId,
      score,
      completed,
      answers: answers || [],
      timeSpent: timeSpent || 0
    };
    
    // Update progress
    const updatedProgress = await UserProgress.create(progressData);
    
    // Update module completion stats
    if (completed) {
      await TrainingModule.findByIdAndUpdate(moduleId, {
        $inc: { completionCount: 1 }
      });
    }
    
    return res.status(200).json(updatedProgress);
  } catch (error: any) {
    console.error('Error updating training progress:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes for managing training modules

// Create a new training module (admin only)
router.post('/modules', requireRole('admin'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const moduleData = req.body;
    
    // Validate required fields
    if (!moduleData.title || !moduleData.description || !moduleData.content || !moduleData.estimatedDuration || !moduleData.category) {
      return res.status(400).json({ message: 'Title, description, content, estimated duration, and category are required' });
    }
    
    // Create module
    const module = new TrainingModule({
      tenantId,
      ...moduleData,
      published: moduleData.published || false,
      featured: moduleData.featured || false
    });
    
    await module.save();
    
    return res.status(201).json({
      message: 'Training module created successfully',
      module
    });
  } catch (error: any) {
    console.error('Error creating training module:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a training module (admin only)
router.put('/modules/:id', requireRole('admin'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const moduleId = req.params.id;
    const moduleData = req.body;
    
    // Find module
    const module = await TrainingModule.findOne({ _id: moduleId, tenantId });
    if (!module) {
      return res.status(404).json({ message: 'Training module not found' });
    }
    
    // Update module
    const updatedModule = await TrainingModule.findByIdAndUpdate(
      moduleId,
      { $set: moduleData },
      { new: true }
    );
    
    return res.json({
      message: 'Training module updated successfully',
      module: updatedModule
    });
  } catch (error: any) {
    console.error('Error updating training module:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a training module (admin only)
router.delete('/modules/:id', requireRole('admin'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const moduleId = req.params.id;
    
    // Find module
    const module = await TrainingModule.findOne({ _id: moduleId, tenantId });
    if (!module) {
      return res.status(404).json({ message: 'Training module not found' });
    }
    
    // Delete module
    await TrainingModule.findByIdAndDelete(moduleId);
    
    // Delete associated progress records
    await UserProgress.deleteMany({ moduleId, tenantId });
    
    return res.json({ message: 'Training module deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting training module:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get training completion statistics (admin only)
router.get('/stats', requireRole('admin'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    
    // Get training modules
    const modules = await TrainingModule.find({ tenantId })
      .select('_id title completionCount averageScore');
    
    // Get overall stats
    const userProgressStats = await UserProgress.aggregate([
      { $match: { tenantId: tenantId.toString() } },
      {
        $group: {
          _id: '$userId',
          completedModules: {
            $sum: { $cond: ['$completed', 1, 0] }
          },
          totalModules: { $sum: 1 },
          averageScore: { $avg: '$score' }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalCompletedModules: { $sum: '$completedModules' },
          averageCompletionRate: { $avg: { $divide: ['$completedModules', '$totalModules'] } },
          overallAverageScore: { $avg: '$averageScore' }
        }
      }
    ]);
    
    return res.json({
      modules,
      stats: userProgressStats[0] || {
        totalUsers: 0,
        totalCompletedModules: 0,
        averageCompletionRate: 0,
        overallAverageScore: 0
      }
    });
  } catch (error: any) {
    console.error('Error getting training statistics:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 