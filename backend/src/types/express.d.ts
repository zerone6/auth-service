import { JwtPayload } from '../services/jwt';
import { User as DbUser, AuthProvider } from '../db/queries';

declare global {
  namespace Express {
    // Express.User can be either:
    // 1. Full User object from database (Passport callback) - has id, provider, provider_id, etc.
    // 2. JwtPayload from JWT token (requireAuth middleware) - has userId, email, role, status
    interface User {
      // From JwtPayload (set by requireAuth middleware)
      userId?: number;
      email: string;
      role: 'admin' | 'user';
      status: 'pending' | 'approved' | 'rejected';
      // From DbUser (set by Passport)
      id?: number;
      provider?: AuthProvider;
      provider_id?: string;
      name?: string | null;
      picture_url?: string | null;
      created_at?: Date;
      updated_at?: Date;
      approved_at?: Date | null;
      approved_by?: number | null;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
