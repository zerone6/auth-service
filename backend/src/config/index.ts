import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    url: process.env.DATABASE_URL || 'postgresql://auth_user:auth_password_change_in_production@localhost:5433/auth',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  session: {
    secret: process.env.SESSION_SECRET || 'change-this-session-secret',
  },

  initialAdmin: {
    email: process.env.INITIAL_ADMIN_EMAIL || '',
  },

  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost', 'http://localhost:5173'],
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  main: {
    url: process.env.MAIN_URL || 'http://localhost:8090',
  },

  cookie: {
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set. Using default value.`);
  }
}
