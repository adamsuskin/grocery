/**
 * Main server entry point
 * Express application with authentication, database, and error handling
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Configuration imports
import { serverConfig, securityConfig, validateEnv } from './config/env';
import { pool, testConnection, getPoolStats } from './config/db';

// Middleware imports
import {
  errorHandler,
  notFoundHandler,
  initializeErrorHandlers,
  asyncHandler,
} from './middleware/errorHandler';

// Route imports
import authRoutes from './auth/routes';
import listsRoutes from './lists/routes';
import usersRoutes from './users/routes';
import activitiesRoutes from './activities/routes';
import invitesRoutes from './invites/routes';
import { authErrorHandler } from './auth/middleware';

/**
 * Validate environment variables on startup
 */
try {
  validateEnv();
  console.log('Environment validation passed');
} catch (error) {
  console.error('Environment validation failed:', error);
  process.exit(1);
}

/**
 * Initialize global error handlers
 */
initializeErrorHandlers();

/**
 * Express application setup
 */
const app = express();

/**
 * Trust proxy - important for rate limiting and getting correct client IPs
 */
app.set('trust proxy', 1);

/**
 * CORS configuration
 */
const corsOptions = {
  origin: serverConfig.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

/**
 * Rate limiting
 */
const limiter = rateLimit({
  windowMs: securityConfig.rateLimitWindowMs,
  max: securityConfig.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

app.use(limiter);

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Request logging middleware (development only)
 */
if (serverConfig.isDevelopment) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
      );
    });
    next();
  });
}

/**
 * Security headers
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (serverConfig.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
});

/**
 * Health check endpoint
 */
app.get(
  '/health',
  asyncHandler(async (req: Request, res: Response) => {
    // Check database connection
    const dbHealthy = await pool
      .query('SELECT 1')
      .then(() => true)
      .catch(() => false);

    const poolStats = getPoolStats();

    const health = {
      success: true,
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: serverConfig.nodeEnv,
      database: {
        connected: dbHealthy,
        pool: poolStats,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };

    res.status(dbHealthy ? 200 : 503).json(health);
  })
);

/**
 * API documentation endpoint
 */
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Grocery List API',
    version: '1.0.0',
    documentation: 'See README.md for full API documentation',
    endpoints: {
      health: 'GET /health - Server health check',
      auth: {
        register: 'POST /api/auth/register - Register new user',
        login: 'POST /api/auth/login - Login user',
        refresh: 'POST /api/auth/refresh - Refresh access token',
        logout: 'POST /api/auth/logout - Logout user',
        me: 'GET /api/auth/me - Get current user',
        profile: 'PATCH /api/auth/profile - Update user profile',
        changePassword: 'POST /api/auth/change-password - Change password',
        health: 'GET /api/auth/health - Auth service health',
      },
      lists: {
        create: 'POST /api/lists - Create new list',
        getAll: 'GET /api/lists - Get all lists for current user',
        getOne: 'GET /api/lists/:id - Get specific list with members',
        update: 'PUT /api/lists/:id - Update list name',
        delete: 'DELETE /api/lists/:id - Delete list',
        addMember: 'POST /api/lists/:id/members - Add member to list',
        removeMember: 'DELETE /api/lists/:id/members/:userId - Remove member from list',
        updateMember: 'PUT /api/lists/:id/members/:userId - Update member permission',
        activities: 'GET /api/lists/:id/activities - Get list activity log',
        health: 'GET /api/lists/health - Lists service health',
      },
      users: {
        search: 'GET /api/users/search?email=... - Search users by email',
      },
      invites: {
        generate: 'POST /api/lists/:id/invite - Generate invite link',
        revoke: 'DELETE /api/lists/:id/invite - Revoke invite link',
        getDetails: 'GET /api/invites/:token - Get invite details (public)',
        accept: 'POST /api/invites/:token/accept - Accept invite and join list',
      },
    },
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/lists', activitiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', invitesRoutes);

/**
 * Error Handling Middleware (must be last)
 */

// Auth-specific error handler
app.use(authErrorHandler);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

/**
 * Start server function
 */
async function startServer(): Promise<void> {
  try {
    console.log('');
    console.log('=============================================');
    console.log('  Starting Grocery List API Server');
    console.log('=============================================');
    console.log('');

    // Test database connection
    console.log('Testing database connection...');
    await testConnection();
    console.log('');

    // Start listening
    app.listen(serverConfig.port, () => {
      console.log('=============================================');
      console.log('  Server Started Successfully');
      console.log('=============================================');
      console.log(`  Environment: ${serverConfig.nodeEnv}`);
      console.log(`  Port: ${serverConfig.port}`);
      console.log(`  URL: http://localhost:${serverConfig.port}`);
      console.log(`  Health: http://localhost:${serverConfig.port}/health`);
      console.log(`  API Docs: http://localhost:${serverConfig.port}/api`);
      console.log(`  CORS Origin: ${serverConfig.corsOrigin}`);
      console.log('=============================================');
      console.log('');
      console.log('Server is ready to accept connections');
      console.log('Press Ctrl+C to stop');
      console.log('');
    });
  } catch (error) {
    console.error('');
    console.error('Failed to start server:', error);
    console.error('');
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log('');
  console.log(`${signal} received, shutting down gracefully...`);

  try {
    // Close database pool
    await pool.end();
    console.log('Database connections closed');

    console.log('Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

/**
 * Process signal handlers
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

/**
 * Start the server
 */
startServer();

export default app;
