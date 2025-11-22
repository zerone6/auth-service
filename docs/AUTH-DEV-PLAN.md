# Auth Service 개발 계획서

## 📋 프로젝트 개요

### 목적
개인 사이트의 과도한 사용 방지를 위한 **독립적이고 재사용 가능한 SSO 기반 인증/인가 시스템** 구축

### 핵심 요구사항
1. 외부 사용자의 과도한 사용 방지 (무료 호스팅 서버 비용 절감)
2. Google OAuth 2.0 기반 인증
3. 관리자 승인 기반 접근 제어
4. 다른 프로젝트에서 재사용 가능한 독립적인 서비스
5. Nginx auth_request를 통한 기술 스택 독립적 통합

---

## 🏗️ 시스템 아키텍처

### 전체 구조

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

### 서비스 구성

| 서비스 | 역할 | 기술 스택 | 포트 |
|--------|------|-----------|------|
| **Auth Backend** | OAuth 처리, JWT 발급/검증, 사용자 관리 | Node.js + Express + Passport.js | 3000 |
| **Auth Frontend** | 로그인 UI, 관리자 대시보드 | React + TypeScript + Vite | 5173 |
| **Auth Database** | 사용자 정보, 세션 저장 | PostgreSQL 16 | 5432 |
| **Nginx** | Reverse Proxy, auth_request 처리 | Nginx Alpine | 80/443 |

---

## 📂 프로젝트 구조

```
auth-service/                           # Git 저장소 루트
│
├── backend/                            # 인증 백엔드
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts                # Google OAuth 처리
│   │   │   ├── verify.ts              # JWT 검증 (Nginx auth_request용)
│   │   │   └── admin.ts               # 관리자 API
│   │   │
│   │   ├── middleware/
│   │   │   ├── jwt.ts                 # JWT 검증 미들웨어
│   │   │   ├── admin.ts               # 관리자 권한 체크
│   │   │   └── error.ts               # 에러 핸들러
│   │   │
│   │   ├── services/
│   │   │   ├── google-oauth.ts        # Google OAuth 로직
│   │   │   ├── jwt.ts                 # JWT 토큰 관리
│   │   │   └── user.ts                # 사용자 관리 로직
│   │   │
│   │   ├── db/
│   │   │   ├── connection.ts          # PostgreSQL 연결
│   │   │   ├── queries.ts             # SQL 쿼리
│   │   │   └── migrations/            # DB 마이그레이션
│   │   │
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript 타입 정의
│   │   │
│   │   ├── config/
│   │   │   └── index.ts               # 환경변수 설정
│   │   │
│   │   └── server.ts                  # Express 서버 진입점
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── .env.example
│   └── .gitignore
│
├── frontend/                           # 인증 UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthButtons.tsx        # Sign In/Up 버튼
│   │   │   ├── LoginModal.tsx         # 로그인 모달
│   │   │   ├── GoogleLoginButton.tsx  # Google 로그인 버튼
│   │   │   ├── AdminDashboard.tsx     # 관리자 대시보드
│   │   │   ├── UserList.tsx           # 사용자 목록
│   │   │   └── PendingApprovals.tsx   # 승인 대기 목록
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts             # 인증 상태 관리
│   │   │   └── useAdmin.ts            # 관리자 API 호출
│   │   │
│   │   ├── services/
│   │   │   └── api.ts                 # API 클라이언트
│   │   │
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript 타입
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── .env.example
│
├── database/
│   ├── schema.sql                      # DB 스키마
│   ├── seeds/
│   │   └── initial-admin.sql          # 초기 관리자 계정
│   └── migrations/                     # 마이그레이션 스크립트
│
├── docs/
│   ├── AUTH-DEV-PLAN.md               # 이 문서
│   ├── ARCHITECTURE.md                # 아키텍처 상세 설계
│   ├── API.md                         # API 명세서
│   ├── INTEGRATION.md                 # 다른 프로젝트 통합 가이드
│   └── DEPLOYMENT.md                  # 배포 가이드
│
├── .github/
│   └── workflows/
│       ├── backend-ci.yml             # Backend CI/CD
│       └── frontend-ci.yml            # Frontend CI/CD
│
├── docker-compose.yml                 # 로컬 개발용
├── docker-compose.prod.yml            # 프로덕션용
├── .gitignore
├── .gitmodules
└── README.md

```

---

## 🔐 인증 플로우

### 1. 로그인 플로우

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthBackend
    participant Google
    participant Database

    User->>Frontend: "Sign In" 클릭
    Frontend->>AuthBackend: GET /auth/google
    AuthBackend->>Google: OAuth 요청 리다이렉트
    Google->>User: 로그인 페이지 표시
    User->>Google: 구글 계정으로 로그인
    Google->>AuthBackend: GET /auth/google/callback (code)
    AuthBackend->>Google: 토큰 교환 요청
    Google->>AuthBackend: Access Token + User Info
    AuthBackend->>Database: 사용자 정보 저장/업데이트
    Database->>AuthBackend: User Record
    AuthBackend->>AuthBackend: JWT 토큰 생성
    AuthBackend->>Frontend: Set-Cookie (JWT, HttpOnly)
    Frontend->>User: 로그인 완료
```

### 2. 인증 검증 플로우 (Nginx auth_request)

```mermaid
sequenceDiagram
    participant User
    participant Nginx
    participant AuthBackend
    participant Service

    User->>Nginx: GET /highschool/
    Nginx->>AuthBackend: GET /verify (with Cookie)
    AuthBackend->>AuthBackend: JWT 검증

    alt JWT 유효 & 사용자 승인됨
        AuthBackend->>Nginx: 200 OK + Headers (X-User-Id, X-User-Status)
        Nginx->>Service: Proxy 요청 (사용자 정보 전달)
        Service->>Nginx: 응답
        Nginx->>User: 페이지 렌더링
    else JWT 무효 또는 미승인
        AuthBackend->>Nginx: 401 Unauthorized
        Nginx->>User: Redirect to /auth/login
    end
```

### 3. 관리자 승인 플로우

```mermaid
sequenceDiagram
    participant NewUser
    participant Admin
    participant AdminDashboard
    participant AuthBackend
    participant Database

    NewUser->>AuthBackend: Google 로그인 (최초)
    AuthBackend->>Database: 사용자 생성 (status=pending)
    Database->>NewUser: "승인 대기 중" 메시지

    Admin->>AdminDashboard: /admin/dashboard 접속
    AdminDashboard->>AuthBackend: GET /admin/users/pending
    AuthBackend->>Database: SELECT pending users
    Database->>AdminDashboard: 승인 대기 목록 표시

    Admin->>AdminDashboard: "승인" 버튼 클릭
    AdminDashboard->>AuthBackend: POST /admin/users/:id/approve
    AuthBackend->>Database: UPDATE user SET status='approved'
    Database->>AdminDashboard: 승인 완료

    NewUser->>Nginx: /highschool/ 재접속
    Nginx->>AuthBackend: /verify
    AuthBackend->>Nginx: 200 OK (status=approved)
    Nginx->>NewUser: 페이지 접근 허용
```

---

## 🗄️ 데이터베이스 스키마

### users 테이블
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture_url TEXT,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### sessions 테이블
```sql
CREATE TABLE sessions (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_expire ON sessions(expire);
```

### audit_log 테이블
```sql
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_user_id INTEGER REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

---

## 🔌 API 엔드포인트

### 인증 API (공개)

#### POST /auth/google
Google OAuth 로그인 시작

**Response:**
```
302 Redirect to Google OAuth
```

#### GET /auth/google/callback
Google OAuth 콜백 처리

**Query Parameters:**
- `code`: OAuth authorization code

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "status": "pending" | "approved",
    "role": "user" | "admin"
  }
}
```

#### POST /auth/logout
로그아웃

**Response:**
```json
{
  "success": true
}
```

#### GET /auth/me
현재 로그인 사용자 정보

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "picture_url": "https://...",
  "status": "approved",
  "role": "user"
}
```

### 검증 API (Nginx auth_request용)

#### GET /verify
JWT 토큰 검증

**Request Headers:**
- `Cookie`: JWT 토큰

**Response:**
- `200 OK` - 인증 성공
  - Headers:
    - `X-User-Id`: 사용자 ID
    - `X-User-Email`: 이메일
    - `X-User-Role`: 역할
    - `X-User-Status`: 상태
- `401 Unauthorized` - 인증 실패

### 관리자 API (관리자 전용)

#### GET /admin/users
모든 사용자 목록 조회

**Query Parameters:**
- `status`: pending | approved | rejected (선택)
- `page`: 페이지 번호 (기본: 1)
- `limit`: 페이지당 항목 수 (기본: 20)

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      "status": "pending",
      "created_at": "2025-11-22T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

#### GET /admin/users/pending
승인 대기 중인 사용자 목록

**Response:**
```json
{
  "users": [
    {
      "id": 2,
      "email": "newuser@example.com",
      "name": "New User",
      "created_at": "2025-11-22T12:00:00Z"
    }
  ]
}
```

#### POST /admin/users/:id/approve
사용자 승인

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "status": "approved",
    "approved_at": "2025-11-22T12:30:00Z"
  }
}
```

#### POST /admin/users/:id/reject
사용자 거부

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "status": "rejected"
  }
}
```

#### DELETE /admin/users/:id
사용자 삭제

**Response:**
```json
{
  "success": true
}
```

---

## 🔧 Nginx 설정

### auth_request 통합

```nginx
# Upstream 정의
upstream auth-backend {
    server auth-backend:3000;
}

# 인증이 필요한 서비스 설정
location /highschool/ {
    # auth_request를 통한 인증 검증
    auth_request /auth-verify;
    auth_request_set $user_id $upstream_http_x_user_id;
    auth_request_set $user_email $upstream_http_x_user_email;
    auth_request_set $user_status $upstream_http_x_user_status;
    auth_request_set $user_role $upstream_http_x_user_role;

    # 승인된 사용자만 접근 허용
    if ($user_status != "approved") {
        return 403;
    }

    # 백엔드로 프록시 (사용자 정보 헤더 전달)
    proxy_pass http://highschool;
    proxy_set_header X-User-Id $user_id;
    proxy_set_header X-User-Email $user_email;
    proxy_set_header X-User-Role $user_role;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# auth_request 내부 location
location = /auth-verify {
    internal;
    proxy_pass http://auth-backend/verify;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
    proxy_set_header Cookie $http_cookie;
}

# 인증 실패 시 리다이렉트
error_page 401 = @error401;
location @error401 {
    return 302 https://$server_name/auth/login?redirect=$request_uri;
}

# 승인 안 된 사용자 (403)
error_page 403 = @error403;
location @error403 {
    return 302 https://$server_name/auth/pending;
}

# 인증 서비스 경로 (공개)
location /auth/ {
    proxy_pass http://auth-backend/auth/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# 관리자 페이지 (인증 필요)
location /admin/ {
    auth_request /auth-verify;
    auth_request_set $user_role $upstream_http_x_user_role;

    # 관리자만 접근 허용
    if ($user_role != "admin") {
        return 403;
    }

    proxy_pass http://auth-frontend/admin/;
    proxy_set_header Host $host;
}
```

---

## 🚀 개발 단계별 계획

### Phase 1: 초기 설정 ✅
- [x] GitHub 저장소 생성
- [x] homegroup에 서브모듈 추가
- [x] 기본 폴더 구조 생성
- [x] 설계 문서 작성 (AUTH-DEV-PLAN.md)

### Phase 2: Database 설정
1. PostgreSQL 컨테이너 설정
2. schema.sql 작성
3. 초기 관리자 계정 시드 데이터 작성
4. 마이그레이션 스크립트 작성

### Phase 3: Backend 개발
1. **프로젝트 초기화**
   - package.json 설정
   - TypeScript 설정
   - Express 서버 기본 구조

2. **Google OAuth 통합**
   - Passport.js 설정
   - Google OAuth Strategy 구현
   - 콜백 처리

3. **JWT 인증**
   - JWT 토큰 생성/검증 로직
   - HttpOnly Cookie 설정
   - Refresh Token 구현 (선택)

4. **API 엔드포인트 구현**
   - /auth/* - 인증 라우트
   - /verify - 검증 엔드포인트
   - /admin/* - 관리자 API

5. **미들웨어**
   - JWT 검증 미들웨어
   - 관리자 권한 체크
   - 에러 핸들러

6. **Database 연결**
   - PostgreSQL 연결 풀
   - SQL 쿼리 함수
   - 트랜잭션 처리

### Phase 4: Frontend 개발
1. **프로젝트 초기화**
   - React + Vite 설정
   - Tailwind CSS 설정
   - React Router 설정

2. **인증 컴포넌트**
   - AuthButtons.tsx - Sign In/Up 버튼
   - LoginModal.tsx - 로그인 모달
   - GoogleLoginButton.tsx - Google 로그인 버튼

3. **관리자 대시보드**
   - AdminDashboard.tsx - 메인 대시보드
   - UserList.tsx - 사용자 목록
   - PendingApprovals.tsx - 승인 대기 목록

4. **Hooks**
   - useAuth.ts - 인증 상태 관리
   - useAdmin.ts - 관리자 API 호출

5. **API 클라이언트**
   - Axios 또는 Fetch API 래퍼
   - 에러 처리
   - 토큰 자동 갱신

### Phase 5: Docker 설정
1. Backend Dockerfile
2. Frontend Dockerfile
3. docker-compose.yml (로컬 개발용)
4. docker-compose.prod.yml (프로덕션용)

### Phase 6: Nginx 통합
1. auth_request 설정 추가
2. /highschool, /realestate, /api 경로에 인증 적용
3. 에러 페이지 설정
4. CORS 설정

### Phase 7: Landing Page 통합
1. AuthButtons 컴포넌트 임베드
2. 로그인 상태 표시
3. 사용자 정보 표시 (로그인 시)

### Phase 8: 초기 관리자 설정
1. 환경변수로 초기 관리자 Google ID 설정
2. 마이그레이션 스크립트 실행
3. 자동 승인 및 admin 권한 부여

### Phase 9: 테스트
1. Unit 테스트 (Backend)
2. Integration 테스트
3. E2E 테스트
4. 보안 테스트

### Phase 10: 배포
1. GHCR에 Docker 이미지 배포
2. GitHub Actions CI/CD 설정
3. 프로덕션 환경 배포
4. 모니터링 설정

---

## 🔒 보안 고려사항

### 1. JWT 토큰 관리
- **HttpOnly Cookie**: XSS 공격 방지
- **Secure Flag**: HTTPS에서만 전송
- **SameSite=Strict**: CSRF 공격 방지
- **만료 시간**: 7일 (조정 가능)
- **Refresh Token**: 장기 세션 유지 (선택)

### 2. OAuth 2.0
- **Client Secret 보호**: 환경변수로만 관리
- **Redirect URI 화이트리스트**: 허용된 도메인만
- **State Parameter**: CSRF 방지
- **Nonce**: Replay 공격 방지

### 3. Database
- **SQL Injection 방지**: Parameterized Query
- **비밀번호 해싱**: bcrypt (OAuth만 사용하므로 불필요)
- **연결 풀**: 성능 최적화
- **인덱스**: 쿼리 성능 향상

### 4. Nginx
- **Rate Limiting**: DDoS 방지
- **IP 화이트리스트**: 관리자 페이지 (선택)
- **SSL/TLS**: HTTPS 강제
- **Security Headers**: HSTS, CSP, X-Frame-Options

### 5. 환경변수
```env
# Backend .env
NODE_ENV=production
PORT=3000

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=https://hstarsp.net/auth/google/callback

# JWT
JWT_SECRET=your_strong_secret_key
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@auth-db:5432/auth

# Initial Admin
INITIAL_ADMIN_EMAIL=your_email@gmail.com

# CORS
ALLOWED_ORIGINS=https://hstarsp.net,http://localhost:5173
```

---

## 📦 다른 프로젝트에서 재사용하기

### 방법 1: Git Submodule

```bash
cd your-new-project
git submodule add https://github.com/zerone6/auth-service.git
git submodule update --init --recursive
```

### 방법 2: Docker Compose

```yaml
# your-project/docker-compose.yml
version: '3.8'

services:
  auth-backend:
    image: ghcr.io/zerone6/auth-service/backend:latest
    environment:
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - DATABASE_URL=${AUTH_DB_URL}
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - web

  auth-db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=auth
      - POSTGRES_USER=auth
      - POSTGRES_PASSWORD=${AUTH_DB_PASSWORD}
    volumes:
      - auth-db-data:/var/lib/postgresql/data
    networks:
      - web

  nginx:
    # nginx 설정에 auth_request 추가
    depends_on:
      - auth-backend

networks:
  web:
    driver: bridge

volumes:
  auth-db-data:
```

### 방법 3: NPM 패키지 (Frontend 컴포넌트)

```bash
# auth-service를 npm 패키지로 배포
npm publish @zerone6/auth-components

# 다른 프로젝트에서 사용
npm install @zerone6/auth-components
```

```tsx
import { AuthButtons, useAuth } from '@zerone6/auth-components'

function App() {
  const { user, isAuthenticated } = useAuth()

  return (
    <header>
      <AuthButtons apiBaseUrl="https://hstarsp.net" />
    </header>
  )
}
```

---

## 📊 성능 최적화

### 1. Nginx 캐싱
```nginx
# auth_request 결과 캐싱 (짧은 시간)
proxy_cache_path /var/cache/nginx/auth levels=1:2 keys_zone=auth_cache:10m max_size=100m inactive=60m;

location = /auth-verify {
    proxy_cache auth_cache;
    proxy_cache_valid 200 1m;  # 1분간 캐시
    proxy_cache_key "$cookie_jwt";
    # ...
}
```

### 2. Database 연결 풀
```typescript
const pool = new Pool({
  max: 20,  // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

### 3. JWT 검증 최적화
- 비동기 검증
- 캐시된 공개키 사용
- 만료 시간 체크 우선

---

## 🧪 테스트 전략

### Unit Tests
- JWT 토큰 생성/검증
- OAuth 콜백 처리
- 사용자 관리 로직

### Integration Tests
- API 엔드포인트 테스트
- Database 트랜잭션 테스트
- Nginx auth_request 통합 테스트

### E2E Tests
- Google 로그인 플로우
- 관리자 승인 플로우
- 인증 후 서비스 접근

---

## 📝 개발 우선순위

### High Priority (P0)
1. Google OAuth 로그인
2. JWT 발급/검증
3. Nginx auth_request 통합
4. 관리자 승인 기능

### Medium Priority (P1)
1. 관리자 대시보드 UI
2. 사용자 목록 관리
3. Audit Log

### Low Priority (P2)
1. Refresh Token
2. 다른 SSO 추가 (GitHub, Facebook)
3. NPM 패키지 배포
4. 이메일 알림

---

## 🎯 Success Metrics

1. **기능 완성도**
   - [ ] Google OAuth 로그인 동작
   - [ ] 관리자 승인 플로우 동작
   - [ ] Nginx auth_request 통합 완료
   - [ ] 모든 서비스에 인증 적용

2. **보안**
   - [ ] JWT HttpOnly Cookie 적용
   - [ ] HTTPS 강제
   - [ ] SQL Injection 방지
   - [ ] XSS/CSRF 방지

3. **재사용성**
   - [ ] Docker 이미지 GHCR 배포
   - [ ] 통합 가이드 문서 완성
   - [ ] 다른 프로젝트에서 테스트

4. **성능**
   - [ ] auth_request 응답 시간 < 100ms
   - [ ] Database 쿼리 < 50ms
   - [ ] 전체 페이지 로드 시간 < 2s

---

## 📚 참고 자료

- [Passport.js Documentation](http://www.passportjs.org/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [JWT.io](https://jwt.io/)
- [Nginx auth_request](http://nginx.org/en/docs/http/ngx_http_auth_request_module.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 📞 Contact

- **Developer**: zerone6
- **Repository**: https://github.com/zerone6/auth-service
- **Issues**: https://github.com/zerone6/auth-service/issues

---

**Last Updated**: 2025-11-22
**Version**: 1.0.0
