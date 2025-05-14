import mongoose, { Document, Schema, Model } from 'mongoose';

// Question type
interface Question {
  id: string;
  text: string;
  type: 'single-choice' | 'multiple-choice' | 'true-false';
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  points: number;
}

// Certificate type
interface Certificate {
  enabled: boolean;
  title: string;
  description: string;
  issuer: string;
  validMonths: number;
}

// Badge type
interface Badge {
  name: string;
  description: string;
  imageUrl: string;
  criteria: {
    minScore: number;
    minCompletionTime?: number;
    maxAttempts?: number;
  };
}

// TrainingModule interface
export interface ITrainingModule extends Document {
  tenantId: string;
  title: string;
  description: string;
  content: string;
  contentType: 'html' | 'markdown' | 'video';
  videoUrl?: string;
  questions: Question[];
  passingScore: number;
  estimatedDuration: number; // in minutes
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  certificate?: Certificate;
  badge?: Badge;
  published: boolean;
  featured: boolean;
  requiredForRoles?: string[];
  prerequisiteModules?: string[];
  completionCount: number;
  averageScore: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define TrainingModule schema
const TrainingModuleSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      enum: ['html', 'markdown', 'video'],
      default: 'html'
    },
    videoUrl: {
      type: String
    },
    questions: [
      {
        id: {
          type: String,
          required: true
        },
        text: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['single-choice', 'multiple-choice', 'true-false'],
          required: true
        },
        options: [
          {
            id: {
              type: String,
              required: true
            },
            text: {
              type: String,
              required: true
            },
            isCorrect: {
              type: Boolean,
              required: true
            }
          }
        ],
        explanation: {
          type: String
        },
        points: {
          type: Number,
          default: 1
        }
      }
    ],
    passingScore: {
      type: Number,
      default: 70
    },
    estimatedDuration: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    tags: {
      type: [String],
      default: []
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    certificate: {
      enabled: {
        type: Boolean,
        default: false
      },
      title: String,
      description: String,
      issuer: String,
      validMonths: {
        type: Number,
        default: 12
      }
    },
    badge: {
      name: String,
      description: String,
      imageUrl: String,
      criteria: {
        minScore: Number,
        minCompletionTime: Number,
        maxAttempts: Number
      }
    },
    published: {
      type: Boolean,
      default: false,
      index: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    requiredForRoles: {
      type: [String],
      default: []
    },
    prerequisiteModules: {
      type: [Schema.Types.ObjectId],
      ref: 'TrainingModule',
      default: []
    },
    completionCount: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
TrainingModuleSchema.index({ tenantId: 1, published: 1 });
TrainingModuleSchema.index({ tenantId: 1, category: 1, published: 1 });
TrainingModuleSchema.index({ tenantId: 1, featured: 1, published: 1 });

// Statics for training module operations
TrainingModuleSchema.statics = {
  /**
   * Get published modules for a tenant
   * @param {String} tenantId - The tenant ID
   * @returns {Promise<ITrainingModule[]>}
   */
  async getPublishedModules(tenantId: string): Promise<ITrainingModule[]> {
    return this.find({ tenantId, published: true })
      .sort({ featured: -1, createdAt: -1 })
      .exec();
  },

  /**
   * Get featured modules for a tenant
   * @param {String} tenantId - The tenant ID
   * @param {Number} limit - Number of modules to return
   * @returns {Promise<ITrainingModule[]>}
   */
  async getFeaturedModules(tenantId: string, limit = 5): Promise<ITrainingModule[]> {
    return this.find({ tenantId, published: true, featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  },

  /**
   * Get modules by category
   * @param {String} tenantId - The tenant ID
   * @param {String} category - The category
   * @returns {Promise<ITrainingModule[]>}
   */
  async getModulesByCategory(tenantId: string, category: string): Promise<ITrainingModule[]> {
    return this.find({ tenantId, category, published: true })
      .sort({ createdAt: -1 })
      .exec();
  },

  /**
   * Update completion statistics
   * @param {String} moduleId - The module ID
   * @param {Number} score - The user's score
   * @returns {Promise<ITrainingModule>}
   */
  async updateCompletionStats(moduleId: string, score: number): Promise<ITrainingModule | null> {
    const module = await this.findById(moduleId).exec();
    
    if (!module) return null;
    
    const currentTotal = module.completionCount * module.averageScore;
    const newTotal = currentTotal + score;
    const newCount = module.completionCount + 1;
    const newAverage = Math.round(newTotal / newCount);
    
    module.completionCount = newCount;
    module.averageScore = newAverage;
    
    return module.save();
  },

  /**
   * Get modules required for a specific role
   * @param {String} tenantId - The tenant ID
   * @param {String} role - The role
   * @returns {Promise<ITrainingModule[]>}
   */
  async getRequiredModulesForRole(tenantId: string, role: string): Promise<ITrainingModule[]> {
    return this.find({ 
      tenantId, 
      published: true,
      requiredForRoles: { $in: [role] }
    }).exec();
  }
};

// Create and export TrainingModule model
const TrainingModule: Model<ITrainingModule> = mongoose.model<ITrainingModule>('TrainingModule', TrainingModuleSchema);
export default TrainingModule; 