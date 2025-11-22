# Phase 5: Nginx 통합 완료

## ✅ 구현된 기능

### 1. Nginx auth_request 설정

**전체 homegroup 보호:**
- 메인 페이지 (`/`): JavaScript로 인증 상태 확인 (로그인 전/후 다른 화면)
- `/highschool/`: auth_request로 보호
- `/realestate/`: auth_request로 보호
- `/api/`: auth_request로 보호

**인증 불필요:**
- `/auth/*`: 인증 라우트 (로그인, 콜백 등)
- `/admin/*`: 관리자 API (자체 미들웨어로 보호)
- `/health`: Health check

---

## 🔐 인증 흐름

### 메인 페이지 (`/`)

**로그인 전:**
```
┌──────────────────────────┐
│  가족 정보 공유 사이트    │
├──────────────────────────┤
│                          │
│      🔐                  │
│  로그인이 필요합니다       │
│                          │
│  [   로그인 버튼   ]      │
│                          │
└──────────────────────────┘
```

**로그인 후:**
```
┌──────────────────────────┐
│  가족 정보 공유 사이트    │
├──────────────────────────┤
│   zerone6@gmail.com      │
│    [ 로그아웃 ]           │
├──────────────────────────┤
│  ┌─────┐    ┌─────┐     │
│  │ 📅  │    │ 🏠  │     │
│  │입시일정│  │부동산 │  │
│  └─────┘    └─────┘     │
└──────────────────────────┘
```

### 서비스 페이지 (`/highschool/`, `/realestate/`)

```
사용자 → /highschool/ 요청
   │
   ├─→ Nginx: auth_request /auth/verify
   │      │
   │      ├─→ Auth Service: JWT 쿠키 확인
   │      │      │
   │      │      ├─ 유효 + approved → 200 OK
   │      │      ├─ 유효 + pending → 403 Forbidden
   │      │      └─ 무효 → 401 Unauthorized
   │      │
   │      ├─ 200 OK → 서비스 페이지 전달
   │      └─ 401/403 → https://hstarsp.net/auth/login 리다이렉트
```

---

## 📁 수정된 파일

### 1. Nginx 설정

**[nginx/conf.d/default.conf](../../nginx/conf.d/default.conf)**

추가된 upstream:
```nginx
upstream auth-service {
    server auth-service:3000;
}
```

추가된 location:
```nginx
# Auth Service Routes
location /auth/ {
    proxy_pass http://auth-service/auth/;
    ...
}

# Auth Verify Endpoint (internal)
location = /auth/verify {
    internal;
    proxy_pass http://auth-service/verify;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header Cookie $http_cookie;
}

# Protected locations with auth_request
location /highschool/ {
    auth_request /auth/verify;
    auth_request_set $auth_user_id $upstream_http_x_auth_user_id;
    auth_request_set $auth_user_email $upstream_http_x_auth_user_email;
    error_page 401 403 = @auth_redirect;
    ...
}
```

Error handlers:
```nginx
# For HTML pages
location @auth_redirect {
    return 302 https://$server_name/auth/login;
}

# For API endpoints
location @auth_error {
    default_type application/json;
    return 401 '{"error": "Unauthorized", "message": "Authentication required"}';
}
```

### 2. 메인 페이지

**[landing-page/main-page/index.html](../../landing-page/main-page/index.html)**

추가된 JavaScript:
```javascript
// Check authentication status
async function checkAuth() {
    const response = await fetch('https://hstarsp.net/auth/status', {
        credentials: 'include'
    });

    if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
            // Show services view
            document.getElementById('servicesView').style.display = 'block';
            document.getElementById('loginView').style.display = 'none';
            document.getElementById('userEmail').textContent = data.user.email;
        } else {
            // Show login view
            document.getElementById('loginView').style.display = 'block';
            document.getElementById('servicesView').style.display = 'none';
        }
    }
}
```

두 가지 뷰:
- `#loginView`: 로그인 카드 (🔐 아이콘 + 로그인 버튼)
- `#servicesView`: 서비스 카드 (입시일정, 부동산)

### 3. Docker Compose

**[docker-compose.local.yml](../../docker-compose.local.yml)**

추가된 서비스:
```yaml
auth-service:
  build:
    context: ./auth-service/backend
    dockerfile: Dockerfile
  container_name: auth-service
  expose:
    - "3000"
  environment:
    - NODE_ENV=production
    - DATABASE_URL=postgresql://auth_user:${AUTH_DB_PASSWORD}@auth-db:5432/auth
    - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
    - GOOGLE_CALLBACK_URL=https://hstarsp.net/auth/google/callback
    ...

auth-db:
  image: postgres:16-alpine
  container_name: auth-db
  environment:
    - POSTGRES_DB=auth
    - POSTGRES_USER=auth_user
    - POSTGRES_PASSWORD=${AUTH_DB_PASSWORD}
  volumes:
    - auth-db-data:/var/lib/postgresql/data
    - ./auth-service/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
```

추가된 볼륨:
```yaml
volumes:
  auth-db-data:
```

### 4. Backend Dockerfile

**[auth-service/backend/Dockerfile](../../auth-service/backend/Dockerfile)**

Multi-stage build:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

---

## ⚙️ 환경변수 설정

### homegroup/.env 파일 생성

```bash
cd /Users/seonpillhwang/GitHub/homegroup
cp .env.example .env
```

필수 환경변수:
```env
# Auth Database Password
AUTH_DB_PASSWORD=<openssl rand -base64 32>

# Google OAuth
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# JWT & Session Secrets
JWT_SECRET=<openssl rand -base64 64>
SESSION_SECRET=<openssl rand -base64 32>

# Initial Admin
INITIAL_ADMIN_EMAIL=zerone6@gmail.com
```

---

## 🚀 배포 가이드

### 1. 환경변수 설정

```bash
cd /Users/seonpillhwang/GitHub/homegroup

# .env 파일 생성
cp .env.example .env

# .env 파일 수정
nano .env
```

### 2. Docker Compose 빌드 및 실행

```bash
# 모든 서비스 빌드
docker compose -f docker-compose.local.yml build

# 서비스 시작
docker compose -f docker-compose.local.yml up -d

# 로그 확인
docker compose -f docker-compose.local.yml logs -f auth-service
```

### 3. 서비스 확인

```bash
# 컨테이너 상태 확인
docker compose -f docker-compose.local.yml ps

# Auth Service 헬스 체크
curl https://hstarsp.net/health

# Auth DB 확인
docker exec auth-db psql -U auth_user -d auth -c "\dt"
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 비로그인 사용자

1. `https://hstarsp.net/` 접속
2. **로그인 카드 표시** 확인
3. `/realestate/` 접속 시도
4. → `/auth/login`으로 리다이렉트

### 시나리오 2: 로그인 플로우

1. 메인 페이지에서 "로그인" 버튼 클릭
2. → `/auth/login` (auth-service frontend)
3. "Continue with Google" 클릭
4. Google 로그인
5. → `/success` 또는 `/pending`
6. 메인 페이지로 이동
7. **서비스 카드 표시** 확인
8. 입시일정 또는 부동산 클릭
9. → 정상 접근

### 시나리오 3: 관리자 승인

1. 초기 관리자로 로그인
2. Success 페이지에서 "Admin Dashboard" 클릭
3. Pending 탭에서 대기 중인 사용자 확인
4. ✓ 버튼으로 승인
5. 해당 사용자 재로그인
6. → 서비스 정상 접근

---

## 🔐 보안 구성

### 1. Nginx auth_request

**작동 방식:**
```
Client Request
   ↓
Nginx (auth_request /auth/verify)
   ↓
Auth Service (/verify endpoint)
   ├─ JWT 쿠키 확인
   ├─ 토큰 검증
   ├─ status 확인 (approved?)
   └─ 200/401/403 응답
   ↓
Nginx
   ├─ 200 → upstream으로 전달
   └─ 401/403 → @auth_redirect
```

### 2. JWT 쿠키

**설정:**
- HttpOnly: JavaScript 접근 불가 (XSS 방지)
- Secure: HTTPS only (production)
- SameSite=lax: CSRF 방지
- 7일 만료

### 3. 헤더 전달

**Nginx → Upstream:**
```nginx
proxy_set_header X-Auth-User-Id $auth_user_id;
proxy_set_header X-Auth-User-Email $auth_user_email;
```

Backend에서 사용:
```javascript
const userId = req.headers['x-auth-user-id'];
const userEmail = req.headers['x-auth-user-email'];
```

---

## 📊 인증 매트릭스

| 경로 | 인증 방법 | 실패 시 동작 | 비고 |
|------|----------|------------|------|
| `/` | JavaScript | 로그인 카드 표시 | 메인 페이지만 접근 가능 |
| `/auth/*` | 불필요 | - | 로그인/콜백 |
| `/admin/*` | Backend 미들웨어 | 401 JSON | requireAdmin |
| `/highschool/*` | auth_request | 302 → /auth/login | 페이지 리다이렉트 |
| `/realestate/*` | auth_request | 302 → /auth/login | 페이지 리다이렉트 |
| `/api/*` | auth_request | 401 JSON | API 전용 |
| `/health` | 불필요 | - | Health check |

---

## 🚨 트러블슈팅

### 인증 루프 (무한 리다이렉트)

**증상:** `/auth/login` ↔ `/auth/google/callback` 반복

**원인:**
1. JWT 쿠키가 설정되지 않음
2. 쿠키 도메인 불일치

**해결:**
```bash
# 쿠키 확인 (브라우저 개발자 도구)
Application → Cookies → https://hstarsp.net
# auth_token 쿠키 존재 확인

# Backend 로그 확인
docker logs auth-service
```

### auth_request 404

**증상:** `/auth/verify`에서 404 응답

**원인:** Auth Service가 실행되지 않음

**해결:**
```bash
# Auth Service 상태 확인
docker ps | grep auth-service

# 재시작
docker compose -f docker-compose.local.yml restart auth-service
```

### 메인 페이지에서 로그인 카드만 표시

**증상:** 로그인 후에도 서비스 카드가 안 보임

**원인:**
1. `/auth/status` 엔드포인트 오류
2. CORS 문제

**해결:**
```bash
# /auth/status 직접 테스트
curl https://hstarsp.net/auth/status \
  -H "Cookie: auth_token=<YOUR_TOKEN>"

# 브라우저 콘솔 확인
# Network 탭에서 /auth/status 응답 확인
```

---

## 📖 참고 문서

- [PHASE3-OAUTH-IMPLEMENTATION.md](./PHASE3-OAUTH-IMPLEMENTATION.md) - Backend OAuth
- [PHASE4-FRONTEND.md](./PHASE4-FRONTEND.md) - Frontend 구현
- [Nginx auth_request 문서](http://nginx.org/en/docs/http/ngx_http_auth_request_module.html)

---

**Phase 5 Status**: ✅ Nginx Integration Complete
**Next**: Production Deployment & SSL Setup
**Last Updated**: 2025-11-22
