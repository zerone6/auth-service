import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../db/queries';

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Generate refresh token (longer expiration)
 */
export function generateRefreshToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '30d', // Refresh token lasts 30 days
  });
}
