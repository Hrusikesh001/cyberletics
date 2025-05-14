import mongoose from 'mongoose';
import config from './config';
import { DatabaseError } from '../utils/errorHandler';

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(
      config.database.uri, 
      config.database.options
    );
    
    console.log(`MongoDB connected: ${connection.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err}`);
      // Emit event for monitoring or alerting system
      if (process.env.NODE_ENV === 'production') {
        // In a production environment, you might want to notify DevOps
        // or trigger an alert in your monitoring system
      }
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      // Attempt to reconnect if not shutting down
      // Check if there was a requested close operation to avoid reconnecting
      const isCloseRequested = mongoose.connection.readyState === 0 &&
        (mongoose.connection as any)._hasBeenClosed;
      
      if (!isCloseRequested) {
        console.log('Attempting to reconnect to MongoDB...');
        setTimeout(() => {
          connectDB().catch(err => {
            console.error('Failed to reconnect to MongoDB:', err);
          });
        }, 5000); // Wait 5 seconds before trying to reconnect
      }
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error: unknown) {
    console.error(`Error connecting to MongoDB: ${error}`);
    
    // Throw a structured error that can be caught by the error handler
    if (error instanceof Error) {
      throw new DatabaseError(`Failed to connect to database: ${error.message}`);
    } else {
      throw new DatabaseError(`Failed to connect to database: ${String(error)}`);
    }

    // In a real production environment, you might want to:
    // 1. Log to a centralized logging service
    // 2. Send an alert
    // 3. Attempt to reconnect after a delay
    // 4. Exit only after multiple failed attempts
    
    // For now, we'll exit the process 
    process.exit(1);
  }
};

export default connectDB; 