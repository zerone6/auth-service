# Auth Service

Google OAuth 2.0 기반의 독립적이고 재사용 가능한 SSO 인증/인가 서비스

## 개요

개인 사이트의 과도한 사용 방지를 위한 인증 시스템으로, 다음과 같은 핵심 기능을 제공합니다:

- **Google OAuth 2.0 인증**: 구글 계정을 통한 간편 로그인
- **관리자 승인 기반 접근 제어**: 신규 사용자는 관리자 승인 후 서비스 이용 가능
- **JWT 토큰 기반 세션 관리**: HTTP-only 쿠키로 안전한 세션 유지
- **Nginx auth_request 통합**: 기술 스택 독립적인 인증 게이트웨이

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
    ┌───────▼───────┐  ┌─────▼──────┐  ┌──────▼───────┐
    │  Landing Page │  │Auth Service│  │   Services   │
    │   (Public)    │  │            │  │  (Protected) │
    └───────────────┘  └─────┬──────┘  └──────┬───────┘
                             │                │
                       ┌─────▼────┐           │
                       │ Auth DB  │           │
                       │PostgreSQL│           │
                       └──────────┘           │
                                              │
                              auth_request ───┘
                              (JWT Verify)
```

## 기술 스택

| 구성요소 | 기술 | 버전 |
|----------|------|------|
| **Backend** | Node.js + Express + TypeScript | 18+ |
| **Frontend** | React + TypeScript + Vite | 18.2 |
| **Database** | PostgreSQL | 16 |
| **Authentication** | Passport.js + JWT | - |
| **API Docs** | Swagger/OpenAPI 3.0 | - |

## 빠른 시작

### 1. 환경 설정

```bash
# 저장소 클론
git clone https://github.com/zerone6/auth-service.git
cd auth-service

# 환경변수 설정
cp backend/.env.example backend/.env
# backend/.env 파일 편집 (Google OAuth 설정 필수)
```

### 2. 개발 환경 실행

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (새 터미널)
cd frontend
npm install
npm run dev
```

### 3. 접속

- **Frontend**: http://localhost:5173/auth/login
- **Backend API**: http://localhost:3000
- **API 문서 (Swagger)**: http://localhost:3000/api-docs

## 사용자 인증 플로우

```
1. 로그인 요청
   User → /auth/login → "Continue with Google" 클릭

2. OAuth 인증
   → /auth/google → Google 로그인 페이지 → 콜백

3. 상태별 리다이렉트
   - pending  → 승인 대기 페이지
   - approved → 메인 페이지
   - rejected → 접근 거부 페이지
```

## 주요 API 엔드포인트

| 경로 | 메소드 | 설명 |
|------|--------|------|
| `/auth/google` | GET | Google OAuth 시작 |
| `/auth/me` | GET | 현재 사용자 정보 |
| `/auth/logout` | POST | 로그아웃 |
| `/verify` | GET | Nginx auth_request용 검증 |
| `/admin/users` | GET | 사용자 목록 (관리자) |
| `/admin/users/:id/approve` | POST | 사용자 승인 |
| `/api-docs` | GET | Swagger UI |

> 전체 API 문서는 `/api-docs` 또는 [BACKEND_STRUCTURE.md](docs/BACKEND_STRUCTURE.md) 참조

## 프로젝트 구조

```
auth-service/
├── backend/                 # Express 백엔드
│   ├── src/
│   │   ├── routes/         # API 라우트
│   │   ├── middleware/     # 인증/에러 미들웨어
│   │   ├── services/       # JWT, Passport
│   │   ├── db/             # 데이터베이스 쿼리
│   │   └── config/         # 환경설정, Swagger
│   └── package.json
│
├── frontend/                # React 프론트엔드
│   ├── src/
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── components/     # 공통 컴포넌트
│   │   └── config/         # OAuth 설정
│   └── package.json
│
├── database/
│   └── schema.sql          # DB 스키마
│
└── docs/                    # 상세 문서
    ├── PROJECT_SUMMARY.md
    ├── BACKEND_STRUCTURE.md
    └── FRONTEND_STRUCTURE.md
```

## 환경변수

주요 환경변수 (`backend/.env`):

```env
# Google OAuth (필수)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT & Session
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/auth

# 초기 관리자
INITIAL_ADMIN_EMAIL=admin@example.com
```

### Secret 생성 방법

`JWT_SECRET`과 `SESSION_SECRET`은 최소 32자 이상의 랜덤 문자열이어야 합니다.

**방법 1: OpenSSL (권장)**
```bash
# 64자 hex 문자열 생성
openssl rand -hex 32

# 또는 base64 인코딩
openssl rand -base64 32

echo "JWT_SECRET: $(openssl rand -hex 32)" && echo "SESSION_SECRET: $(openssl rand -hex 32)"
```

**방법 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**방법 3: Python**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**방법 4: /dev/urandom (Linux/macOS)**
```bash
head -c 32 /dev/urandom | xxd -p -c 64
```

> 전체 환경변수 목록은 [backend/.env.example](backend/.env.example) 참조

## 테스트

```bash
cd backend

npm test              # 테스트 실행
npm run test:watch    # Watch 모드
npm run test:coverage # 커버리지 리포트
```

**테스트 현황**: 44개 테스트 통과, 4개 스킵 (DB 통합 테스트)

## Nginx 통합

보호된 서비스에 인증 게이트웨이 적용:

```nginx
location /protected-service/ {
    auth_request /auth/verify;
    auth_request_set $auth_user_id $upstream_http_x_auth_user_id;
    error_page 401 403 = @auth_redirect;

    proxy_pass http://upstream-service;
    proxy_set_header X-Auth-User-Id $auth_user_id;
}

location = /auth/verify {
    internal;
    proxy_pass http://auth-service/verify;
    proxy_pass_request_body off;
    proxy_set_header Cookie $http_cookie;
}
```

## 상세 문서

| 문서 | 내용 |
|------|------|
| [PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md) | 전체 프로젝트 개요, 인증 플로우, DB 스키마 |
| [BACKEND_STRUCTURE.md](docs/BACKEND_STRUCTURE.md) | 백엔드 구조, API 명세, 미들웨어, 테스트 |
| [FRONTEND_STRUCTURE.md](docs/FRONTEND_STRUCTURE.md) | 프론트엔드 구조, 페이지별 설명, 스타일링 |

## 다른 프로젝트에서 재사용

### Git Submodule로 추가

```bash
cd your-project
git submodule add https://github.com/zerone6/auth-service.git
git submodule update --init --recursive
```

### Docker Compose 통합

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

## 라이선스

MIT License

---

**Last Updated**: 2025-12-28
