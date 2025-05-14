import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';

/**
 * Validator middleware factory
 * @param schema Joi schema to validate against
 * @param property Request property to validate ('body', 'query', 'params')
 */
export const validate = (schema: Joi.Schema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[property];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        message: detail.message,
        path: detail.path,
        type: detail.type
      }));

      return next(new ValidationError('Validation failed', errorDetails));
    }

    // Replace the data with validated data
    req[property] = value;
    return next();
  };
};

/**
 * Common validation schemas
 */
export const schemas = {
  // User schemas
  user: {
    create: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      name: Joi.string().required(),
      tenantId: Joi.string().required()
    }),
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }),
    update: Joi.object({
      name: Joi.string(),
      email: Joi.string().email(),
      role: Joi.string().valid('admin', 'user', 'super-admin'),
      isActive: Joi.boolean()
    }),
    changePassword: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required()
    }),
    resetPassword: Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string().min(8).required()
    })
  },

  // Tenant schemas
  tenant: {
    create: Joi.object({
      name: Joi.string().pattern(/^[a-z0-9-]+$/).required()
        .message('Tenant name can only contain lowercase letters, numbers, and hyphens'),
      displayName: Joi.string().required(),
      domain: Joi.string().domain().allow(''),
      settings: Joi.object({
        gophishApiKey: Joi.string().required(),
        gophishApiUrl: Joi.string().uri(),
        emailFrom: Joi.string().email().required(),
        primaryColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
        secondaryColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
        allowUserRegistration: Joi.boolean(),
        maxUsers: Joi.number().integer().min(1),
        maxCampaigns: Joi.number().integer().min(1),
        allowedTemplates: Joi.array().items(Joi.string())
      }).required()
    }),
    update: Joi.object({
      displayName: Joi.string(),
      domain: Joi.string().domain().allow(''),
      logoUrl: Joi.string().uri().allow(''),
      settings: Joi.object({
        gophishApiKey: Joi.string(),
        gophishApiUrl: Joi.string().uri(),
        emailFrom: Joi.string().email(),
        primaryColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
        secondaryColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
        allowUserRegistration: Joi.boolean(),
        maxUsers: Joi.number().integer().min(1),
        maxCampaigns: Joi.number().integer().min(1),
        allowedTemplates: Joi.array().items(Joi.string())
      }),
      status: Joi.string().valid('active', 'suspended', 'pending'),
      plan: Joi.string().valid('free', 'basic', 'professional', 'enterprise')
    }),
    changeStatus: Joi.object({
      status: Joi.string().valid('active', 'suspended', 'pending').required()
    }),
    addUser: Joi.object({
      email: Joi.string().email().required(),
      role: Joi.string().valid('admin', 'user').default('user')
    })
  },

  // Training module schemas
  training: {
    createModule: Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      content: Joi.string().required(),
      contentType: Joi.string().valid('html', 'markdown', 'video').default('html'),
      videoUrl: Joi.string().uri().when('contentType', {
        is: 'video',
        then: Joi.required()
      }),
      questions: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          text: Joi.string().required(),
          type: Joi.string().valid('single-choice', 'multiple-choice', 'true-false').required(),
          options: Joi.array().items(
            Joi.object({
              id: Joi.string().required(),
              text: Joi.string().required(),
              isCorrect: Joi.boolean().required()
            })
          ).required(),
          explanation: Joi.string(),
          points: Joi.number().default(1)
        })
      ),
      passingScore: Joi.number().min(0).max(100).default(70),
      estimatedDuration: Joi.number().required(),
      category: Joi.string().required(),
      tags: Joi.array().items(Joi.string()),
      difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
      published: Joi.boolean().default(false),
      featured: Joi.boolean().default(false)
    }),
    updateProgress: Joi.object({
      moduleId: Joi.string().required(),
      score: Joi.number().min(0).max(100).required(),
      completed: Joi.boolean().required(),
      timeSpent: Joi.number().min(0),
      answers: Joi.array().items(
        Joi.object({
          questionId: Joi.string().required(),
          selectedOptions: Joi.array().items(Joi.string()),
          isCorrect: Joi.boolean(),
          timeSpent: Joi.number().min(0)
        })
      )
    })
  },

  // Report schemas
  report: {
    dateRange: Joi.object({
      startDate: Joi.date(),
      endDate: Joi.date().min(Joi.ref('startDate'))
    }),
    heatmap: Joi.object({
      campaignId: Joi.string(),
      eventType: Joi.string().valid('clicked', 'email_opened', 'submitted_data', 'email_sent').default('clicked')
    })
  },

  // ID parameter schema
  id: Joi.object({
    id: Joi.string().required()
  })
}; 