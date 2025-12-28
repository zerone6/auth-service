/**
 * Auth Route Integration Tests
 *
 * Tests for /auth endpoints.
 *
 * Note: Tests for /auth/me and /auth/status require database integration
 * because the routes use dynamic imports. These are marked as integration
 * tests and skipped in unit test mode.
 */

import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import authRoutes from '../../routes/auth';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {

  describe('GET /auth/failure', () => {
    it('should return 401 with error message', async () => {
      const response = await request(app).get('/auth/failure');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toEqual({
        code: 'AUTH_FAILED',
        message: 'Google authentication failed',
      });
      expect(response.body.path).toBe('/failure');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear auth cookie and return success', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', 'auth_token=some-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        message: 'Logged out successfully',
      });
      expect(response.body.timestamp).toBeDefined();

      // Check that cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('auth_token=');
    });
  });

  // Note: /auth/me and /auth/status use dynamic imports for database queries
  // These tests require database integration and are skipped in unit test mode
  describe('GET /auth/me', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
    });

    // Integration test - requires database connection
    it.skip('should return user info for authenticated user (requires DB)', async () => {
      // This test requires actual database connection due to dynamic imports in auth.ts
    });

    // Integration test - requires database connection
    it.skip('should return 404 if user not found in database (requires DB)', async () => {
      // This test requires actual database connection due to dynamic imports in auth.ts
    });
  });

  describe('GET /auth/status', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/auth/status');

      expect(response.status).toBe(401);
    });

    // Integration test - requires database connection
    it.skip('should return authenticated status for valid user (requires DB)', async () => {
      // This test requires actual database connection due to dynamic imports in auth.ts
    });

    // Integration test - requires database connection
    it.skip('should include user role and status (requires DB)', async () => {
      // This test requires actual database connection due to dynamic imports in auth.ts
    });
  });
});
