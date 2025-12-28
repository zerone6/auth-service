/**
 * Auth Middleware Unit Tests
 *
 * Tests for authentication and authorization middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { requireAuth, requireAdmin, requireApproved, optionalAuth } from '../../middleware/auth';
import { generateToken } from '../../services/jwt';

// Mock user data
const mockApprovedUser = {
  id: 1,
  google_id: 'google-123',
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
  status: 'pending' as const,
};

const mockAdminUser = {
  ...mockApprovedUser,
  id: 3,
  email: 'admin@example.com',
  role: 'admin' as const,
};

// Helper to create mock request/response/next
function createMocks(overrides: Partial<Request> = {}) {
  const req = {
    cookies: {},
    headers: {},
    user: undefined,
    ...overrides,
  } as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  return { req, res, next };
}

describe('Auth Middleware', () => {
  describe('requireAuth', () => {
    it('should call next() when valid token is in cookie', async () => {
      const token = generateToken(mockApprovedUser);
      const { req, res, next } = createMocks({
        cookies: { auth_token: token },
      });

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(mockApprovedUser.id);
    });

    it('should call next() when valid token is in Authorization header', async () => {
      const token = generateToken(mockApprovedUser);
      const { req, res, next } = createMocks({
        headers: { authorization: `Bearer ${token}` },
      });

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });

    it('should return 401 when no token provided', async () => {
      const { req, res, next } = createMocks();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when invalid token provided', async () => {
      const { req, res, next } = createMocks({
        cookies: { auth_token: 'invalid-token' },
      });

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should prefer cookie over Authorization header', async () => {
      const cookieToken = generateToken(mockApprovedUser);
      const headerToken = generateToken(mockAdminUser);
      const { req, res, next } = createMocks({
        cookies: { auth_token: cookieToken },
        headers: { authorization: `Bearer ${headerToken}` },
      });

      await requireAuth(req, res, next);

      expect(req.user?.email).toBe(mockApprovedUser.email);
    });
  });

  describe('requireAdmin', () => {
    it('should call next() for admin user', () => {
      const { req, res, next } = createMocks();
      req.user = {
        userId: mockAdminUser.id,
        email: mockAdminUser.email,
        role: 'admin',
        status: 'approved',
      };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 for non-admin user', () => {
      const { req, res, next } = createMocks();
      req.user = {
        userId: mockApprovedUser.id,
        email: mockApprovedUser.email,
        role: 'user',
        status: 'approved',
      };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: 'Admin access required',
        })
      );
    });

    it('should return 401 when no user attached', () => {
      const { req, res, next } = createMocks();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 for unapproved admin', () => {
      const { req, res, next } = createMocks();
      req.user = {
        userId: 4,
        email: 'pending-admin@example.com',
        role: 'admin',
        status: 'pending',
      };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireApproved', () => {
    it('should call next() for approved user', () => {
      const { req, res, next } = createMocks();
      req.user = {
        userId: mockApprovedUser.id,
        email: mockApprovedUser.email,
        role: 'user',
        status: 'approved',
      };

      requireApproved(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 for pending user', () => {
      const { req, res, next } = createMocks();
      req.user = {
        userId: mockPendingUser.id,
        email: mockPendingUser.email,
        role: 'user',
        status: 'pending',
      };

      requireApproved(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: 'Account pending approval',
        })
      );
    });

    it('should return 401 when no user attached', () => {
      const { req, res, next } = createMocks();

      requireApproved(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('optionalAuth', () => {
    it('should attach user when valid token provided', async () => {
      const token = generateToken(mockApprovedUser);
      const { req, res, next } = createMocks({
        cookies: { auth_token: token },
      });

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(mockApprovedUser.id);
    });

    it('should call next() without user when no token provided', async () => {
      const { req, res, next } = createMocks();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should call next() without user when invalid token provided', async () => {
      const { req, res, next } = createMocks({
        cookies: { auth_token: 'invalid-token' },
      });

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
});
