import { pool } from './connection';

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
}

export interface AuditLogEntry {
  admin_id: number;
  action: string;
  target_user_id?: number;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Find user by Google ID
 */
export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE google_id = $1',
    [googleId]
  );
  return result.rows[0] || null;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Find user by ID
 */
export async function findUserById(id: number): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Create new user (default status: pending)
 */
export async function createUser(
  googleId: string,
  email: string,
  name: string | null,
  pictureUrl: string | null,
  initialAdminEmail?: string
): Promise<User> {
  // Check if this is the initial admin
  const isInitialAdmin = initialAdminEmail && email === initialAdminEmail;

  const result = await pool.query(
    `INSERT INTO users (google_id, email, name, picture_url, role, status, approved_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      googleId,
      email,
      name,
      pictureUrl,
      isInitialAdmin ? 'admin' : 'user',
      isInitialAdmin ? 'approved' : 'pending',
      isInitialAdmin ? new Date() : null
    ]
  );

  return result.rows[0];
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  id: number,
  name: string | null,
  pictureUrl: string | null
): Promise<User | null> {
  const result = await pool.query(
    `UPDATE users
     SET name = $1, picture_url = $2
     WHERE id = $3
     RETURNING *`,
    [name, pictureUrl, id]
  );
  return result.rows[0] || null;
}

/**
 * Approve user (admin action)
 */
export async function approveUser(
  userId: number,
  adminId: number
): Promise<User | null> {
  const result = await pool.query(
    `UPDATE users
     SET status = 'approved', approved_at = NOW(), approved_by = $1
     WHERE id = $2
     RETURNING *`,
    [adminId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Reject user (admin action)
 */
export async function rejectUser(
  userId: number,
  adminId: number
): Promise<User | null> {
  const result = await pool.query(
    `UPDATE users
     SET status = 'rejected', approved_by = $1
     WHERE id = $2
     RETURNING *`,
    [adminId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Get all pending users (for admin approval)
 */
export async function getPendingUsers(): Promise<User[]> {
  const result = await pool.query(
    `SELECT * FROM users
     WHERE status = 'pending'
     ORDER BY created_at ASC`
  );
  return result.rows;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(
  status?: 'pending' | 'approved' | 'rejected'
): Promise<User[]> {
  let query = 'SELECT * FROM users';
  const params: any[] = [];

  if (status) {
    query += ' WHERE status = $1';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Log admin action to audit_log
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  await pool.query(
    `INSERT INTO audit_log (admin_id, action, target_user_id, details, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      entry.admin_id,
      entry.action,
      entry.target_user_id || null,
      entry.details ? JSON.stringify(entry.details) : null,
      entry.ip_address || null,
      entry.user_agent || null
    ]
  );
}

/**
 * Get audit logs (admin only)
 */
export async function getAuditLogs(
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  const result = await pool.query(
    `SELECT
       al.*,
       u1.email as admin_email,
       u2.email as target_email
     FROM audit_log al
     LEFT JOIN users u1 ON al.admin_id = u1.id
     LEFT JOIN users u2 ON al.target_user_id = u2.id
     ORDER BY al.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}
