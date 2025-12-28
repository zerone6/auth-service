import { Router, Request, Response } from 'express';
import passport from 'passport';
import { generateToken } from '../services/jwt';
import { User, findUserById } from '../db/queries';
import { config } from '../config';
import { requireAuth } from '../middleware/auth';
import {
  asyncHandler,
  NotFoundError,
  InternalError,
} from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Google OAuth 로그인 시작
 *     description: |
 *       Google OAuth 2.0 인증 플로우를 시작합니다.
 *       사용자를 Google 로그인 페이지로 리다이렉트합니다.
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Google OAuth 페이지로 리다이렉트
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth 콜백
 *     description: |
 *       Google OAuth 인증 완료 후 콜백 엔드포인트.
 *       JWT 토큰을 생성하고 쿠키에 저장한 후 사용자 상태에 따라 리다이렉트합니다.
 *       - approved: 메인 페이지로 리다이렉트
 *       - pending: 승인 대기 페이지로 리다이렉트
 *       - rejected: 거부 페이지로 리다이렉트
 *     tags: [Auth]
 *     parameters:
 *       - name: code
 *         in: query
 *         description: Google OAuth 인증 코드
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: 사용자 상태에 따른 페이지로 리다이렉트
 *         headers:
 *           Set-Cookie:
 *             description: JWT 토큰이 포함된 auth_token 쿠키
 *             schema:
 *               type: string
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
      return res.redirect(`${config.frontend.url}/?status=pending`);
    } else if (user.status === 'approved') {
      // Redirect to success page (landing page)
      return res.redirect(`${config.frontend.url}/`);
    } else {
      // Rejected
      return res.redirect(`${config.frontend.url}/?status=rejected`);
    }
  }
);

/**
 * @swagger
 * /auth/failure:
 *   get:
 *     summary: 인증 실패 페이지
 *     description: OAuth 인증 실패 시 반환되는 에러 응답
 *     tags: [Auth]
 *     responses:
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: AUTH_FAILED
 *                 message: Google authentication failed
 *               timestamp: "2025-12-28T12:00:00.000Z"
 *               path: /failure
 */
router.get('/failure', (req: Request, res: Response) => {
  res.status(401).json({
    success: false,
    error: {
      code: 'AUTH_FAILED',
      message: 'Google authentication failed',
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 로그아웃
 *     description: auth_token 쿠키를 삭제하여 사용자를 로그아웃합니다.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 message: Logged out successfully
 *               timestamp: "2025-12-28T12:00:00.000Z"
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
  });
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: 현재 사용자 정보 조회
 *     description: 인증된 사용자의 프로필 정보를 반환합니다.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 반환
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get full user info from database (includes picture_url)
      const user = await findUserById(req.user!.userId!);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture_url: user.picture_url,
            role: user.role,
            status: user.status,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalError('Failed to fetch user information');
    }
  })
);

/**
 * @swagger
 * /auth/status:
 *   get:
 *     summary: 인증 상태 확인
 *     description: 현재 사용자의 인증 상태와 프로필 정보를 반환합니다.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 인증 상태 반환
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
 *                     authenticated:
 *                       type: boolean
 *                       example: true
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/status',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get full user info from database (includes picture_url)
      const user = await findUserById(req.user!.userId!);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: {
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture_url: user.picture_url,
            role: user.role,
            status: user.status,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalError('Failed to fetch user information');
    }
  })
);

export default router;
