import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  getAuditLogs,
  logAuditAction,
} from '../db/queries';

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /admin/users/pending
 * Get all users pending approval
 */
router.get('/users/pending', async (req: Request, res: Response) => {
  try {
    const users = await getPendingUsers();
    res.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch pending users',
    });
  }
});

/**
 * GET /admin/users
 * Get all users (with optional status filter)
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
    const users = await getAllUsers(status);
    res.json({
      success: true,
      users,
      count: users.length,
      filter: status || 'all',
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users',
    });
  }
});

/**
 * POST /admin/users/:id/approve
 * Approve a user
 */
router.post('/users/:id/approve', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const adminId = req.user!.userId;

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid user ID',
      });
    }

    const user = await approveUser(userId, adminId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Log admin action
    await logAuditAction({
      admin_id: adminId,
      action: 'approve_user',
      target_user_id: userId,
      details: { email: user.email, name: user.name },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'User approved successfully',
      user,
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to approve user',
    });
  }
});

/**
 * POST /admin/users/:id/reject
 * Reject a user
 */
router.post('/users/:id/reject', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const adminId = req.user!.userId;

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid user ID',
      });
    }

    const user = await rejectUser(userId, adminId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Log admin action
    await logAuditAction({
      admin_id: adminId,
      action: 'reject_user',
      target_user_id: userId,
      details: { email: user.email, name: user.name },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'User rejected successfully',
      user,
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reject user',
    });
  }
});

/**
 * GET /admin/audit-logs
 * Get audit logs
 */
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const logs = await getAuditLogs(limit, offset);

    res.json({
      success: true,
      logs,
      count: logs.length,
      pagination: {
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch audit logs',
    });
  }
});

/**
 * GET /admin/stats
 * Get admin statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      getAllUsers('pending'),
      getAllUsers('approved'),
      getAllUsers('rejected'),
    ]);

    res.json({
      success: true,
      stats: {
        total: pending.length + approved.length + rejected.length,
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch statistics',
    });
  }
});

export default router;
