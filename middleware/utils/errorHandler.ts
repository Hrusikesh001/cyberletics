import { Request, Response, NextFunction } from 'express';

// Custom error classes
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  errors: any;
  
  constructor(message = 'Validation failed', errors?: any) {
    super(message, 422);
    this.errors = errors;
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable') {
    super(message, 503);
  }
}

// Error handler middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let error = err;
  
  // Convert Mongoose/MongoDB errors to AppError
  if (err.name === 'CastError') {
    error = new BadRequestError('Invalid data format');
  }
  
  if (err.name === 'ValidationError') {
    error = new ValidationError('Validation failed', err);
  }
  
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    error = new BadRequestError('Duplicate entry exists');
  }
  
  if (err.name === 'JsonWebTokenError') {
    error = new UnauthorizedError('Invalid token');
  }
  
  if (err.name === 'TokenExpiredError') {
    error = new UnauthorizedError('Token expired');
  }
  
  // Log error
  console.error('ERROR 💥', {
    message: err.message,
    name: err.name,
    stack: err.stack,
    isOperational: (err as AppError).isOperational || false
  });
  
  // Operational errors - trusted error: send message to client
  if ((error as AppError).isOperational) {
    return res.status((error as AppError).statusCode).json({
      status: 'error',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
      ...(error instanceof ValidationError ? { errors: error.errors } : {})
    });
  }
  
  // Programming or unknown errors: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', error);
  
  // 2) Send generic message
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' ? { 
      originalError: error.message,
      stack: error.stack 
    } : {})
  });
};

// Async handler to catch async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found middleware
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route not found: ${req.originalUrl}`));
};

// Rate limiter error handler
export const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    status: 'error',
    message: 'Too many requests, please try again later'
  });
}; 