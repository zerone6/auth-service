/**
 * Verify Route Integration Tests
 *
 * Tests for /verify endpoints (Nginx auth_request).
 */

import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { generateToken } from '../../services/jwt';
import verifyRoutes from '../../routes/verify';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/verify', verifyRoutes);

// Mock user data
const mockApprovedUser = {
  id: 1,
  provider: 'google' as const,
  provider_id: 'google-123',
  email: 'user@example.com',
  name: 'Test User',
  picture_url: 'https://example.com/pic.jpg',
  role: 'user' as const,
  status: 'approved' as const,
  created_at: new Date(),
  updated_at: new Date(),
  approved_at: new Date(),
  approved_by: null,
};

const mockPendingUser = {
  ...mockApprovedUser,
  id: 2,
  email: 'pending@example.com',
  status: 'pending' as const,
};

const mockAdminUser = {
  ...mockApprovedUser,
  id: 3,
  email: 'admin@example.com',
  role: 'admin' as const,
};

describe('Verify Routes', () => {
  describe('GET /verify', () => {
    it('should return 200 OK for approved user with cookie', async () => {
      const token = generateToken(mockApprovedUser);

      const response = await request(app)
        .get('/verify')
        .set('Cookie', `auth_token=${token}`);

      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');
      expect(response.headers['x-auth-user-id']).toBe(mockApprovedUser.id.toString());
      expect(response.headers['x-auth-user-email']).toBe(mockApprovedUser.email);
      expect(response.headers['x-auth-user-role']).toBe(mockApprovedUser.role);
    });

    it('should return 200 OK for approved user with Bearer token', async () => {
      const token = generateToken(mockApprovedUser);

      const response = await request(app)
        .get('/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');
    });

    it('should return 401 Unauthorized when no token', async () => {
      const response = await request(app).get('/verify');

      expect(response.status).toBe(401);
      expect(response.text).toBe('Unauthorized');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/verify')
        .set('Cookie', 'auth_token=invalid-token');

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid token');
    });

    it('should return 403 for pending user', async () => {
      const token = generateToken(mockPendingUser);

      const response = await request(app)
        .get('/verify')
        .set('Cookie', `auth_token=${token}`);

      expect(response.status).toBe(403);
      expect(response.text).toBe('Not approved');
    });

    it('should return 403 for rejected user', async () => {
      const rejectedUser = { ...mockApprovedUser, status: 'rejected' as const };
      const token = generateToken(rejectedUser);

      const response = await request(app)
        .get('/verify')
        .set('Cookie', `auth_token=${token}`);

      expect(response.status).toBe(403);
      expect(response.text).toBe('Not approved');
    });
  });

  describe('GET /verify/admin', () => {
    it('should return 200 OK for approved admin', async () => {
      const token = generateToken(mockAdminUser);

      const response = await request(app)
        .get('/verify/admin')
        .set('Cookie', `auth_token=${token}`);

      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');
      expect(response.headers['x-auth-user-role']).toBe('admin');
    });

    it('should return 403 for non-admin user', async () => {
      const token = generateToken(mockApprovedUser);

      const response = await request(app)
        .get('/verify/admin')
        .set('Cookie', `auth_token=${token}`);

      expect(response.status).toBe(403);
      expect(response.text).toBe('Admin required');
    });

    it('should return 401 when no token', async () => {
      const response = await request(app).get('/verify/admin');

      expect(response.status).toBe(401);
    });

    it('should return 403 for pending admin', async () => {
      const pendingAdmin = { ...mockAdminUser, status: 'pending' as const };
      const token = generateToken(pendingAdmin);

      const response = await request(app)
        .get('/verify/admin')
        .set('Cookie', `auth_token=${token}`);

      expect(response.status).toBe(403);
      expect(response.text).toBe('Not approved');
    });
  });
});
