import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  env: string;
  server: {
    port: number;
    hostname: string;
  };
  database: {
    uri: string;
    options: {
      useNewUrlParser: boolean;
      useUnifiedTopology: boolean;
      autoIndex: boolean;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
      family: number;
    };
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: string;
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    standardHeaders: boolean;
    legacyHeaders: boolean;
    message: string;
  };
  logging: {
    level: string;
    format: string;
  };
  gophish: {
    baseUrl: string;
    apiKey: string;
    useSSL: boolean;
    verifySSL: boolean;
  };
}

// Default configuration
const config: Config = {
  env: process.env.NODE_ENV || 'development',
  
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    hostname: process.env.HOST || '0.0.0.0'
  },
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sentrifense',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'dev'
  },
  
  gophish: {
    baseUrl: process.env.GOPHISH_BASE_URL || 'https://localhost:3333/api',
    apiKey: process.env.GOPHISH_API_KEY || '',
    useSSL: process.env.GOPHISH_USE_SSL !== 'false',
    verifySSL: process.env.GOPHISH_VERIFY_SSL === 'true'
  }
};

// Validate critical configuration
const validateConfig = () => {
  const criticalEnvVars = [
    { key: 'JWT_SECRET', value: config.jwt.secret, defaultValue: 'your-secret-key-change-in-production' },
    { key: 'MONGODB_URI', value: config.database.uri, defaultValue: 'mongodb://localhost:27017/sentrifense' },
    { key: 'GOPHISH_API_KEY', value: config.gophish.apiKey, defaultValue: '' }
  ];

  const usingDefaults = criticalEnvVars.filter(
    ({ value, defaultValue }) => value === defaultValue
  );

  if (config.env === 'production' && usingDefaults.length > 0) {
    const missingVars = usingDefaults.map(({ key }) => key).join(', ');
    console.warn(`WARNING: Using default values for critical environment variables in production: ${missingVars}`);
  }
};

validateConfig();

export default config; 