# Auth Service 프로젝트 요약

## 프로젝트 개요

**목적**: 개인 사이트의 과도한 사용 방지를 위한 독립적이고 재사용 가능한 SSO 기반 인증/인가 시스템

**핵심 요구사항**:
- Google OAuth 2.0 기반 인증
- 관리자 승인 기반 접근 제어
- Nginx auth_request를 통한 기술 스택 독립적 통합
- 다른 프로젝트에서 재사용 가능한 독립적인 서비스

---

## 시스템 아키텍처

```
                                Internet
                                   │
                                   ▼
                        ┌──────────────────┐
                        │   Nginx Proxy    │
                        │  (Port 443/80)   │
                        └────────┬─────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
        ┌───────▼───────┐ ┌─────▼──────┐ ┌──────▼───────┐
        │  Landing Page │ │Auth Service│ │   Services   │
        │   (Public)    │ │            │ │  (Protected) │
        └───────────────┘ └─────┬──────┘ └──────┬───────┘
                                │                │
                          ┌─────▼────┐          │
                          │ Auth DB  │          │
                          │PostgreSQL│          │
                          └──────────┘          │
                                                │
                                auth_request ───┘
                                (JWT Verify)
```

---

## 서비스 구성

| 서비스 | 역할 | 기술 스택 | 포트 |
|--------|------|-----------|------|
| **Auth Backend** | OAuth 처리, JWT 발급/검증, 사용자 관리 | Node.js + Express + Passport.js | 3000 |
| **Auth Frontend** | 로그인 UI, 관리자 대시보드 | React + TypeScript + Vite | 5173 |
| **Auth Database** | 사용자 정보, 세션 저장 | PostgreSQL 16 | 5432 |
| **Nginx** | Reverse Proxy, auth_request 처리 | Nginx Alpine | 80/443 |

---

## 프로젝트 구조

```
auth-service/
├── backend/                    # 인증 백엔드 (Node.js + Express)
│   ├── src/
│   │   ├── routes/            # API 라우트
│   │   │   ├── auth.ts        # 인증 API
│   │   │   ├── verify.ts      # 검증 API (Nginx auth_request)
│   │   │   └── admin.ts       # 관리자 API
│   │   ├── middleware/        # Express 미들웨어
│   │   ├── services/          # 비즈니스 로직
│   │   ├── db/                # 데이터베이스 관련
│   │   │   ├── connection.ts  # DB 연결
│   │   │   └── queries.ts     # 인증 쿼리
│   │   ├── config/            # 환경변수 설정
│   │   └── server.ts          # Express 서버 진입점
│   ├── run-migration.js       # 마이그레이션 실행 스크립트
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/                   # 인증 UI (React + Vite)
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── config/            # 설정 파일
│   │   ├── types/             # TypeScript 타입
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── database/
│   └── schema.sql             # DB 스키마
│
└── docs/                      # 문서
    ├── PROJECT_SUMMARY.md
    ├── BACKEND_STRUCTURE.md
    ├── FRONTEND_STRUCTURE.md
    └── refactoring_result.md
```

---

## 인증 플로우

### 1. 로그인 플로우

```
User → Frontend(/auth/login) → "Continue with Google" 클릭
  → Backend(/auth/google) → Google OAuth 페이지
  → Google 로그인 → Backend(/auth/google/callback)
  → 사용자 생성/업데이트 → JWT 토큰 발급 → Cookie 설정
  → 상태별 리다이렉트:
     - pending → /pending (승인 대기)
     - approved → / (메인 페이지)
     - rejected → /rejected (접근 거부)
```

### 2. 인증 검증 플로우 (Nginx auth_request)

```
User → Nginx(/protected-service/) 요청
  → Nginx → Backend(/verify) + Cookie 전달
  → JWT 검증:
     - 유효 + approved → 200 OK + 사용자 정보 헤더
     - 유효 + pending/rejected → 403 Forbidden
     - 무효 → 401 Unauthorized
  → Nginx:
     - 200 OK → 서비스로 프록시 (사용자 정보 헤더 전달)
     - 401/403 → /auth/login으로 리다이렉트
```

### 3. 관리자 승인 플로우

```
신규 사용자 → Google 로그인 → status: pending → "승인 대기" 표시
관리자 → /admin 대시보드 → Pending 목록 확인 → 승인/거부
승인된 사용자 → 재로그인 → 서비스 접근 가능
```

---

## 데이터베이스 스키마

### 테이블 구조

| 테이블 | 용도 |
|--------|------|
| **users** | 사용자 정보 (Google ID, 이메일, 이름, 역할, 상태) |
| **sessions** | 세션 저장 (express-session용) |
| **audit_log** | 관리자 활동 로그 (승인/거부 기록) |

### users 테이블 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | Primary Key |
| google_id | VARCHAR(255) | Google OAuth ID |
| email | VARCHAR(255) | 이메일 |
| name | VARCHAR(255) | 이름 |
| picture_url | TEXT | 프로필 이미지 URL |
| role | VARCHAR(50) | 역할 (admin / user) |
| status | VARCHAR(50) | 상태 (pending / approved / rejected) |
| approved_by | INTEGER | 승인한 관리자 ID |

---

## Nginx 통합

### auth_request 설정 개요

```nginx
# 보호된 서비스
location /protected-service/ {
    auth_request /auth/verify;
    auth_request_set $auth_user_id $upstream_http_x_auth_user_id;
    auth_request_set $auth_user_email $upstream_http_x_auth_user_email;
    error_page 401 403 = @auth_redirect;

    proxy_pass http://upstream-service;
    proxy_set_header X-Auth-User-Id $auth_user_id;
    proxy_set_header X-Auth-User-Email $auth_user_email;
}

# 내부 검증 엔드포인트
location = /auth/verify {
    internal;
    proxy_pass http://auth-service/verify;
    proxy_pass_request_body off;
    proxy_set_header Cookie $http_cookie;
}

# 인증 실패 시 리다이렉트
location @auth_redirect {
    return 302 /auth/login;
}
```

---

## 보안 설정

### JWT 쿠키 설정

| 옵션 | 값 | 설명 |
|------|-----|------|
| httpOnly | true | XSS 공격 방지 |
| secure | production에서 true | HTTPS에서만 전송 |
| sameSite | lax | CSRF 공격 방지 |
| maxAge | 7일 | 토큰 만료 시간 |

### 초기 관리자 자동 승인

- 환경변수 `INITIAL_ADMIN_EMAIL`로 설정된 이메일로 첫 로그인 시
- 자동으로 `role: admin`, `status: approved` 부여

---

## 환경변수

### 필수 환경변수

```env
# Google OAuth
GOOGLE_CLIENT_ID=<Google Cloud Console에서 발급>
GOOGLE_CLIENT_SECRET=<Google Cloud Console에서 발급>
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

# JWT
JWT_SECRET=<openssl rand -base64 64로 생성>
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=<openssl rand -base64 32로 생성>

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# 초기 관리자
INITIAL_ADMIN_EMAIL=admin@example.com

# Frontend URL
FRONTEND_URL=https://your-domain.com

# CORS
ALLOWED_ORIGINS=https://your-domain.com
```

---

## 재사용 방법

### Git Submodule로 추가

```bash
cd your-new-project
git submodule add https://github.com/zerone6/auth-service.git
git submodule update --init --recursive
```

### Docker Compose로 실행

```yaml
services:
  auth-service:
    build: ./auth-service/backend
    environment:
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - DATABASE_URL=postgresql://auth_user:${AUTH_DB_PASSWORD}@auth-db:5432/auth
    depends_on:
      - auth-db

  auth-db:
    image: postgres:16-alpine
    volumes:
      - ./auth-service/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
```

---

## 참고 문서

- [FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md) - 프론트엔드 상세 구조
- [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) - 백엔드 상세 구조
- [refactoring_result.md](./refactoring_result.md) - 리팩토링 내역 및 TODO

---

**Last Updated**: 2025-12-28
