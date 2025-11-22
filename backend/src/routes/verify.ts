import { Router, Request, Response } from 'express';
import { verifyToken } from '../services/jwt';

const router = Router();

/**
 * GET /verify
 * Verify JWT token for Nginx auth_request
 * Returns 200 if valid and approved, 401/403 otherwise
 */
router.get('/', (req: Request, res: Response) => {
  try {
    // Try to get token from cookie first, then Authorization header
    let token = req.cookies?.auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).send('Unauthorized');
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).send('Invalid token');
    }

    // Check if user is approved
    if (payload.status !== 'approved') {
      return res.status(403).send('Not approved');
    }

    // Token is valid and user is approved
    // Set headers for Nginx to pass to upstream
    res.setHeader('X-Auth-User-Id', payload.userId.toString());
    res.setHeader('X-Auth-User-Email', payload.email);
    res.setHeader('X-Auth-User-Role', payload.role);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * GET /verify/admin
 * Verify JWT token and admin role for Nginx auth_request
 * Returns 200 if valid, approved, and admin, 401/403 otherwise
 */
router.get('/admin', (req: Request, res: Response) => {
  try {
    let token = req.cookies?.auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).send('Unauthorized');
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).send('Invalid token');
    }

    if (payload.status !== 'approved') {
      return res.status(403).send('Not approved');
    }

    if (payload.role !== 'admin') {
      return res.status(403).send('Admin required');
    }

    res.setHeader('X-Auth-User-Id', payload.userId.toString());
    res.setHeader('X-Auth-User-Email', payload.email);
    res.setHeader('X-Auth-User-Role', payload.role);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
