import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import { testConnection } from './db/connection';
import { configurePassport } from './services/passport';
import authRoutes from './routes/auth';
import verifyRoutes from './routes/verify';
import adminRoutes from './routes/admin';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
app.set('trust proxy', true);

// Configure Passport
configurePassport();

// Security middleware (CSP 설정을 Swagger UI가 작동하도록 조정)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
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
      ...(config.cookie.domain && { domain: config.cookie.domain }),
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

// Swagger UI (API Documentation)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Auth Service API Docs',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/auth', authRoutes);
app.use('/verify', verifyRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

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
║   - GET  /api-docs            (Swagger UI)               ║
║   - GET  /auth/google         (Google OAuth login)       ║
║   - GET  /verify              (Nginx auth_request)       ║
║   - GET  /admin/*             (Admin API)                ║
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
