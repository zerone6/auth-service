// @ts-nocheck
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import { config } from './config';
import { testConnection } from './db/connection';
import { configurePassport } from './services/passport';
import authRoutes from './routes/auth';
import verifyRoutes from './routes/verify';
import adminRoutes from './routes/admin';
import calculatorRoutes from './routes/calculator';

const app = express();

// Configure Passport
configurePassport();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware (for Passport)
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

// Database health check
app.get('/db/health', async (req: Request, res: Response) => {
  const isConnected = await testConnection();
  res.json({
    database: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/verify', verifyRoutes);
app.use('/admin', adminRoutes);
app.use('/api/calculator', calculatorRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔐 Auth Service Backend                                ║
║                                                           ║
║   Environment: ${config.nodeEnv.padEnd(40)}║
║   Port:        ${config.port.toString().padEnd(40)}║
║   Database:    ✅ Connected                              ║
║                                                           ║
║   Endpoints:                                              ║
║   - GET  /health              (Health check)             ║
║   - GET  /db/health           (Database health)          ║
║   - GET  /auth/google         (Google OAuth login)       ║
║   - GET  /verify              (Nginx auth_request)       ║
║   - GET  /admin/*             (Admin API)                ║
║   - *    /api/calculator/*    (Calculator API)           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
