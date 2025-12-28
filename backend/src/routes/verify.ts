import { Router, Request, Response } from 'express';
import { verifyToken } from '../services/jwt';

const router = Router();

/**
 * @swagger
 * /verify:
 *   get:
 *     summary: JWT 토큰 검증 (Nginx auth_request용)
 *     description: |
 *       Nginx auth_request 지시어용 엔드포인트.
 *       승인된 사용자의 유효한 JWT 토큰이 있으면 200 OK를 반환합니다.
 *       응답 헤더에 사용자 정보를 포함하여 upstream 서비스로 전달합니다.
 *     tags: [Verify]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 인증 성공
 *         headers:
 *           X-Auth-User-Id:
 *             description: 사용자 ID
 *             schema:
 *               type: string
 *           X-Auth-User-Email:
 *             description: 사용자 이메일
 *             schema:
 *               type: string
 *           X-Auth-User-Role:
 *             description: 사용자 역할 (admin/user)
 *             schema:
 *               type: string
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: OK
 *       401:
 *         description: 인증 실패 (토큰 없음 또는 유효하지 않음)
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Unauthorized
 *       403:
 *         description: 접근 거부 (승인되지 않은 사용자)
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Not approved
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
 * @swagger
 * /verify/admin:
 *   get:
 *     summary: 관리자 JWT 토큰 검증 (Nginx auth_request용)
 *     description: |
 *       Nginx auth_request 지시어용 관리자 전용 엔드포인트.
 *       승인된 관리자의 유효한 JWT 토큰이 있으면 200 OK를 반환합니다.
 *     tags: [Verify]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 관리자 인증 성공
 *         headers:
 *           X-Auth-User-Id:
 *             description: 사용자 ID
 *             schema:
 *               type: string
 *           X-Auth-User-Email:
 *             description: 사용자 이메일
 *             schema:
 *               type: string
 *           X-Auth-User-Role:
 *             description: 사용자 역할 (admin)
 *             schema:
 *               type: string
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: OK
 *       401:
 *         description: 인증 실패
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Unauthorized
 *       403:
 *         description: 접근 거부 (관리자 권한 필요)
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Admin required
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
