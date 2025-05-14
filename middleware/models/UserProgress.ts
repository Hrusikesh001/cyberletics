import mongoose, { Document, Schema } from 'mongoose';

// User training progress interface
export interface IUserProgress extends Document {
  userId: string;
  tenantId: string;
  moduleId: string;
  completed: boolean;
  score: number;
  attemptsCount: number;
  lastAttemptDate: Date;
  completedDate?: Date;
  timeSpent: number; // in seconds
  answers: {
    questionId: string;
    selectedOptions: string[];
    isCorrect: boolean;
    timeSpent: number; // in seconds
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// User progress schema
const UserProgressSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    moduleId: {
      type: String,
      required: true,
      index: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    },
    attemptsCount: {
      type: Number,
      default: 0
    },
    lastAttemptDate: {
      type: Date,
      default: Date.now
    },
    completedDate: {
      type: Date
    },
    timeSpent: {
      type: Number,
      default: 0
    },
    answers: [
      {
        questionId: {
          type: String,
          required: true
        },
        selectedOptions: {
          type: [String],
          default: []
        },
        isCorrect: {
          type: Boolean,
          default: false
        },
        timeSpent: {
          type: Number,
          default: 0
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
UserProgressSchema.index({ userId: 1, tenantId: 1, moduleId: 1 }, { unique: true });

// Statics
UserProgressSchema.statics = {
  /**
   * Get user's progress for all modules
   * @param {String} userId
   * @param {String} tenantId
   * @returns {Promise<IUserProgress[]>}
   */
  async getUserProgress(userId: string, tenantId: string): Promise<IUserProgress[]> {
    return this.find({ userId, tenantId }).sort({ updatedAt: -1 }).exec();
  },

  /**
   * Update user's progress for a module
   * @param {Object} progressData
   * @returns {Promise<IUserProgress>}
   */
  async updateProgress(progressData: Partial<IUserProgress>): Promise<IUserProgress> {
    const { userId, tenantId, moduleId } = progressData;

    const existingProgress = await this.findOne({ userId, tenantId, moduleId });

    if (existingProgress) {
      // Update existing record
      Object.assign(existingProgress, {
        ...progressData,
        attemptsCount: existingProgress.attemptsCount + 1,
        lastAttemptDate: new Date()
      });

      // Set completion date if newly completed
      if (progressData.completed && !existingProgress.completedDate) {
        existingProgress.completedDate = new Date();
      }

      return existingProgress.save();
    } else {
      // Create new record
      return this.create({
        ...progressData,
        attemptsCount: 1,
        lastAttemptDate: new Date(),
        completedDate: progressData.completed ? new Date() : undefined
      });
    }
  },

  /**
   * Get completion statistics by tenant
   * @param {String} tenantId
   * @returns {Promise<Object>}
   */
  async getCompletionStats(tenantId: string): Promise<{
    totalUsers: number;
    completedModules: number;
    averageScore: number;
  }> {
    const stats = await this.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: '$userId',
          completedModules: {
            $sum: { $cond: ['$completed', 1, 0] }
          },
          totalModules: { $sum: 1 },
          totalScore: { $sum: '$score' }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          completedModules: { $sum: '$completedModules' },
          totalScoreSum: { $sum: '$totalScore' },
          totalModulesCount: { $sum: '$totalModules' }
        }
      }
    ]);

    if (stats.length === 0) {
      return { totalUsers: 0, completedModules: 0, averageScore: 0 };
    }

    const result = stats[0];
    return {
      totalUsers: result.totalUsers,
      completedModules: result.completedModules,
      averageScore: result.totalModulesCount > 0 
        ? Math.round(result.totalScoreSum / result.totalModulesCount) 
        : 0
    };
  }
};

// Create and export the model
const UserProgress = mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);
export default UserProgress; 