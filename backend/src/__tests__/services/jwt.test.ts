/**
 * JWT Service Unit Tests
 *
 * Tests for JWT token generation and verification.
 */

import { generateToken, verifyToken, JwtPayload } from '../../services/jwt';

// Mock user data
const mockUser = {
  id: 1,
  google_id: 'google-123',
  email: 'test@example.com',
  name: 'Test User',
  picture_url: 'https://example.com/pic.jpg',
  role: 'user' as const,
  status: 'approved' as const,
  created_at: new Date(),
  updated_at: new Date(),
  approved_at: new Date(),
  approved_by: null,
};

const mockAdminUser = {
  ...mockUser,
  id: 2,
  email: 'admin@example.com',
  role: 'admin' as const,
};

describe('JWT Service', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token for a user', () => {
      const token = generateToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate a valid JWT token for an admin', () => {
      const token = generateToken(mockAdminUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateToken(mockUser);
      const token2 = generateToken(mockAdminUser);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockUser);
      const payload = verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(mockUser.id);
      expect(payload?.email).toBe(mockUser.email);
      expect(payload?.role).toBe(mockUser.role);
      expect(payload?.status).toBe(mockUser.status);
    });

    it('should return null for an invalid token', () => {
      const payload = verifyToken('invalid-token');

      expect(payload).toBeNull();
    });

    it('should return null for a malformed token', () => {
      const payload = verifyToken('not.a.valid.jwt.token');

      expect(payload).toBeNull();
    });

    it('should return null for an empty token', () => {
      const payload = verifyToken('');

      expect(payload).toBeNull();
    });

    it('should correctly decode admin role', () => {
      const token = generateToken(mockAdminUser);
      const payload = verifyToken(token);

      expect(payload?.role).toBe('admin');
    });

    it('should correctly decode user status', () => {
      const pendingUser = { ...mockUser, status: 'pending' as const };
      const token = generateToken(pendingUser);
      const payload = verifyToken(token);

      expect(payload?.status).toBe('pending');
    });
  });

  describe('Token Payload Structure', () => {
    it('should contain required fields in payload', () => {
      const token = generateToken(mockUser);
      const payload = verifyToken(token) as JwtPayload;

      expect(payload).toHaveProperty('userId');
      expect(payload).toHaveProperty('email');
      expect(payload).toHaveProperty('role');
      expect(payload).toHaveProperty('status');
    });

    it('should not contain sensitive data in payload', () => {
      const token = generateToken(mockUser);
      const payload = verifyToken(token) as JwtPayload & Record<string, unknown>;

      // Should not contain these fields
      expect(payload).not.toHaveProperty('google_id');
      expect(payload).not.toHaveProperty('picture_url');
      expect(payload).not.toHaveProperty('password');
    });
  });
});
