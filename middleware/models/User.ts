import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// User interface
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'super-admin';
  tenants: { tenantId: string; role: 'admin' | 'user' }[];
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(tenantId: string): string;
}

// Define User schema
const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'super-admin'],
      default: 'user'
    },
    tenants: [
      {
        tenantId: {
          type: Schema.Types.ObjectId,
          ref: 'Tenant',
          required: true
        },
        role: {
          type: String,
          enum: ['admin', 'user'],
          default: 'user'
        },
        _id: false
      }
    ],
    lastLogin: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  const user = this as IUser;
  
  // Only hash the password if it's modified or new
  if (!user.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  const user = this as IUser;
  return bcrypt.compare(password, user.password);
};

// Method to generate JWT token
UserSchema.methods.generateAuthToken = function(tenantId: string): string {
  const user = this as IUser;
  
  // Get JWT secret from environment
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  
  // Create and return JWT token with user info and tenant context
  return jwt.sign(
    { 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      },
      tenantId
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
};

// Create and export User model
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User; 