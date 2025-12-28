import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0',
      description: `
Google OAuth 2.0 기반 인증 서비스 API

## 개요
- Google OAuth를 통한 사용자 인증
- JWT 토큰 기반 세션 관리
- 관리자 승인 기반 접근 제어
- Nginx auth_request를 통한 보호 서비스 통합

## 인증 방식
- **Cookie**: \`auth_token\` 쿠키에 JWT 토큰 저장
- **Bearer Token**: \`Authorization: Bearer <token>\` 헤더

## 사용자 상태
- \`pending\`: 승인 대기 중
- \`approved\`: 승인됨 (서비스 접근 가능)
- \`rejected\`: 거부됨
      `,
      contact: {
        name: 'Auth Service',
      },
    },
    servers: [
      {
        url: config.nodeEnv === 'production'
          ? 'https://your-domain.com'
          : `http://localhost:${config.port}`,
        description: config.nodeEnv === 'production' ? 'Production' : 'Development',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'OAuth 인증 및 사용자 세션 관리',
      },
      {
        name: 'Verify',
        description: 'Nginx auth_request용 JWT 검증 엔드포인트',
      },
      {
        name: 'Admin',
        description: '관리자 전용 사용자 관리 API',
      },
      {
        name: 'Health',
        description: '서비스 상태 확인',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth_token',
          description: 'JWT 토큰이 저장된 HTTP-only 쿠키',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 토큰',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            picture_url: { type: 'string', format: 'uri', nullable: true },
            role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'], example: 'approved' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        ApiSuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'NOT_FOUND' },
                message: { type: 'string', example: 'Resource not found' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string', example: '/admin/users/123' },
          },
        },
        Stats: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 100 },
            pending: { type: 'integer', example: 5 },
            approved: { type: 'integer', example: 90 },
            rejected: { type: 'integer', example: 5 },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            admin_id: { type: 'integer' },
            action: { type: 'string', example: 'approve_user' },
            target_user_id: { type: 'integer' },
            details: { type: 'object' },
            ip_address: { type: 'string' },
            user_agent: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: '인증 필요',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              example: {
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
                timestamp: '2025-12-28T12:00:00.000Z',
                path: '/auth/me',
              },
            },
          },
        },
        ForbiddenError: {
          description: '접근 거부',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              example: {
                success: false,
                error: { code: 'FORBIDDEN', message: 'Access denied' },
                timestamp: '2025-12-28T12:00:00.000Z',
                path: '/admin/users',
              },
            },
          },
        },
        NotFoundError: {
          description: '리소스 없음',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              example: {
                success: false,
                error: { code: 'NOT_FOUND', message: 'User not found' },
                timestamp: '2025-12-28T12:00:00.000Z',
                path: '/admin/users/999',
              },
            },
          },
        },
        InternalError: {
          description: '서버 오류',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              example: {
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
                timestamp: '2025-12-28T12:00:00.000Z',
                path: '/admin/users',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
