declare namespace Express {
  export interface User {
    id: number;
    google_id: string;
    email: string;
    name: string | null;
    picture_url: string | null;
    role: 'admin' | 'user';
    status: 'pending' | 'approved' | 'rejected';
    created_at: Date;
    updated_at: Date;
    approved_at: Date | null;
    approved_by: number | null;
    userId?: number;
  }

  export interface Request {
    user?: User;
  }
}

export {};
