// @ts-nocheck
import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { generateToken } from '../services/jwt';
import { User } from '../db/queries';
import { config } from '../config';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * GET /auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/failure',
    session: false,
  }),
  (req: Request, res: Response) => {
    const user = req.user as User;

    if (!user) {
      return res.redirect('/auth/failure');
    }

    // Generate JWT token
    const token = generateToken(user);

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect based on user status
    if (user.status === 'pending') {
      // Redirect to pending approval page
      return res.redirect(`${config.frontend.url}/pending`);
    } else if (user.status === 'approved') {
      // Redirect to success page
      return res.redirect(`${config.frontend.url}/success`);
    } else {
      // Rejected
      return res.redirect(`${config.frontend.url}/rejected`);
    }
  }
);

/**
 * GET /auth/failure
 * Authentication failure page
 */
router.get('/failure', (req: Request, res: Response) => {
  res.status(401).json({
    error: 'Authentication failed',
    message: 'Google authentication failed',
  });
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
  });
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    user: req.user,
  });
});

/**
 * GET /auth/status
 * Check authentication status
 */
router.get('/status', requireAuth, (req: Request, res: Response) => {
  res.json({
    authenticated: true,
    user: req.user,
  });
});

export default router;
