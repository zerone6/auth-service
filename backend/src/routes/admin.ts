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
import {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  InternalError,
} from '../middleware/errorHandler';

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @swagger
 * /admin/users/pending:
 *   get:
 *     summary: 승인 대기 사용자 목록 조회
 *     description: 승인 대기 중인 모든 사용자 목록을 반환합니다.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 승인 대기 사용자 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     count:
 *                       type: integer
 *                       example: 5
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/users/pending',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const users = await getPendingUsers();
      res.json({
        success: true,
        data: { users, count: users.length },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw new InternalError('Failed to fetch pending users');
    }
  })
);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: 전체 사용자 목록 조회
 *     description: 모든 사용자 목록을 반환합니다. status 파라미터로 필터링 가능합니다.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         description: 사용자 상태로 필터링
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: 사용자 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     count:
 *                       type: integer
 *                     filter:
 *                       type: string
 *                       example: all
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
      const users = await getAllUsers(status);
      res.json({
        success: true,
        data: { users, count: users.length, filter: status || 'all' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw new InternalError('Failed to fetch users');
    }
  })
);

/**
 * @swagger
 * /admin/users/{id}/approve:
 *   post:
 *     summary: 사용자 승인
 *     description: 지정된 사용자를 승인합니다. 감사 로그가 자동으로 기록됩니다.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 사용자 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 승인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: User approved successfully
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 잘못된 사용자 ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/users/:id/approve',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id, 10);
    const adminId = req.user!.userId!;

    if (isNaN(userId)) {
      throw new BadRequestError('Invalid user ID');
    }

    try {
      const user = await approveUser(userId, adminId);

      if (!user) {
        throw new NotFoundError('User not found');
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
        data: { message: 'User approved successfully', user },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      throw new InternalError('Failed to approve user');
    }
  })
);

/**
 * @swagger
 * /admin/users/{id}/reject:
 *   post:
 *     summary: 사용자 거부
 *     description: 지정된 사용자를 거부합니다. 감사 로그가 자동으로 기록됩니다.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 사용자 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 거부 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: User rejected successfully
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 잘못된 사용자 ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/users/:id/reject',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id, 10);
    const adminId = req.user!.userId!;

    if (isNaN(userId)) {
      throw new BadRequestError('Invalid user ID');
    }

    try {
      const user = await rejectUser(userId, adminId);

      if (!user) {
        throw new NotFoundError('User not found');
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
        data: { message: 'User rejected successfully', user },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      throw new InternalError('Failed to reject user');
    }
  })
);

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: 감사 로그 조회
 *     description: 관리자 활동 감사 로그를 조회합니다. 페이지네이션을 지원합니다.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: 반환할 로그 수 (기본값 100)
 *         schema:
 *           type: integer
 *           default: 100
 *       - name: offset
 *         in: query
 *         description: 건너뛸 로그 수 (기본값 0)
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: 감사 로그 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuditLog'
 *                     count:
 *                       type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/audit-logs',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 100;
      const offset = parseInt(req.query.offset as string, 10) || 0;

      const logs = await getAuditLogs(limit, offset);

      res.json({
        success: true,
        data: {
          logs,
          count: logs.length,
          pagination: { limit, offset },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw new InternalError('Failed to fetch audit logs');
    }
  })
);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: 사용자 통계 조회
 *     description: 전체, 승인 대기, 승인됨, 거부됨 사용자 수 통계를 반환합니다.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 통계
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       $ref: '#/components/schemas/Stats'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const [pending, approved, rejected] = await Promise.all([
        getAllUsers('pending'),
        getAllUsers('approved'),
        getAllUsers('rejected'),
      ]);

      res.json({
        success: true,
        data: {
          stats: {
            total: pending.length + approved.length + rejected.length,
            pending: pending.length,
            approved: approved.length,
            rejected: rejected.length,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw new InternalError('Failed to fetch statistics');
    }
  })
);

export default router;
