# Phase 3: Google OAuth & JWT 구현 완료

## ✅ 구현된 기능

### 1. 데이터베이스 쿼리 함수 (`src/db/queries.ts`)

**사용자 관리:**
- `findUserByGoogleId()` - Google ID로 사용자 검색
- `findUserByEmail()` - 이메일로 사용자 검색
- `findUserById()` - ID로 사용자 검색
- `createUser()` - 신규 사용자 생성 (초기 관리자 자동 승인)
- `updateUserProfile()` - 프로필 업데이트
- `approveUser()` - 사용자 승인 (관리자)
- `rejectUser()` - 사용자 거부 (관리자)
- `getPendingUsers()` - 승인 대기 목록
- `getAllUsers()` - 전체 사용자 목록 (필터링 지원)

**감사 로그:**
- `logAuditAction()` - 관리자 활동 기록
- `getAuditLogs()` - 감사 로그 조회

### 2. JWT 토큰 관리 (`src/services/jwt.ts`)

- `generateToken()` - JWT 토큰 생성 (7일)
- `verifyToken()` - JWT 토큰 검증
- `generateRefreshToken()` - Refresh 토큰 생성 (30일)

**JWT Payload:**
```typescript
{
  userId: number;
  email: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
}
```

### 3. Passport.js Google OAuth (`src/services/passport.ts`)

- Google OAuth 2.0 Strategy 설정
- 기존 사용자 자동 프로필 업데이트
- 신규 사용자 자동 생성
- 초기 관리자 자동 승인 로직

### 4. 인증 미들웨어 (`src/middleware/auth.ts`)

- `requireAuth` - JWT 인증 필수
- `requireApproved` - 승인된 사용자만
- `requireAdmin` - 관리자만
- `optionalAuth` - 선택적 인증

**토큰 위치:**
- Cookie: `auth_token` (우선순위 1)
- Header: `Authorization: Bearer <token>` (우선순위 2)

### 5. 인증 라우트 (`src/routes/auth.ts`)

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | `/auth/google` | Google OAuth 시작 |
| GET | `/auth/google/callback` | Google OAuth 콜백 |
| GET | `/auth/failure` | 인증 실패 |
| POST | `/auth/logout` | 로그아웃 |
| GET | `/auth/me` | 현재 사용자 정보 |
| GET | `/auth/status` | 인증 상태 확인 |

**OAuth 흐름:**
```
사용자 → /auth/google → Google Login → /auth/google/callback
  → JWT 토큰 발급 → Cookie 설정
  → status별 리다이렉트:
     - pending: /pending
     - approved: /success
     - rejected: /rejected
```

### 6. 검증 라우트 (`src/routes/verify.ts`)

Nginx `auth_request` 지시어용 엔드포인트:

| 메소드 | 경로 | 설명 | 응답 |
|--------|------|------|------|
| GET | `/verify` | 승인된 사용자 검증 | 200 (OK) / 401 / 403 |
| GET | `/verify/admin` | 관리자 검증 | 200 (OK) / 401 / 403 |

**응답 헤더:**
- `X-Auth-User-Id`: 사용자 ID
- `X-Auth-User-Email`: 이메일
- `X-Auth-User-Role`: 역할 (admin/user)

### 7. 관리자 API (`src/routes/admin.ts`)

모든 엔드포인트는 `requireAuth` + `requireAdmin` 필수

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | `/admin/users/pending` | 승인 대기 목록 |
| GET | `/admin/users` | 전체 사용자 (`?status=pending\|approved\|rejected`) |
| POST | `/admin/users/:id/approve` | 사용자 승인 |
| POST | `/admin/users/:id/reject` | 사용자 거부 |
| GET | `/admin/audit-logs` | 감사 로그 (`?limit=100&offset=0`) |
| GET | `/admin/stats` | 통계 (총/대기/승인/거부 수) |

**자동 감사 로그:**
- 승인/거부 시 자동으로 audit_log에 기록
- IP 주소, User-Agent 포함

---

## 📁 생성된 파일

```
backend/src/
├── db/
│   └── queries.ts              # DB 쿼리 함수
├── services/
│   ├── jwt.ts                  # JWT 토큰 관리
│   └── passport.ts             # Passport.js 설정
├── middleware/
│   └── auth.ts                 # 인증 미들웨어
├── routes/
│   ├── auth.ts                 # 인증 라우트
│   ├── verify.ts               # 검증 라우트 (Nginx용)
│   └── admin.ts                # 관리자 API
├── config/
│   └── index.ts                # 환경변수 (FRONTEND_URL 추가)
└── server.ts                   # 모든 라우트 통합
```

---

## 🧪 테스트 가이드

### 1. 서버 재시작 확인

서버가 `npm run dev`로 실행 중이라면 ts-node-dev가 자동 재시작합니다.

예상 출력:
```
✅ Database connected successfully
✅ Database connection test passed: 2025-11-22...

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔐 Auth Service Backend                                ║
║                                                           ║
║   Environment: development                             ║
║   Port:        3000                                    ║
║   Database:    ✅ Connected                              ║
║                                                           ║
║   Endpoints:                                              ║
║   - GET  /health           (Health check)                ║
║   - GET  /db/health        (Database health)             ║
║   - GET  /auth/google      (Google OAuth login)          ║
║   - GET  /verify           (Nginx auth_request)          ║
║   - GET  /admin/*          (Admin API)                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### 2. Google OAuth 테스트

**브라우저에서:**
```
http://localhost:3000/auth/google
```

**예상 동작:**
1. Google 로그인 페이지로 리다이렉트
2. 로그인 후 `/auth/google/callback` 호출
3. JWT 토큰이 `auth_token` 쿠키에 저장됨
4. 상태에 따라 리다이렉트:
   - 초기 관리자 (INITIAL_ADMIN_EMAIL): `/success` (자동 승인)
   - 일반 사용자: `/pending` (승인 대기)

### 3. 인증 상태 확인

```bash
# 현재 사용자 정보 (쿠키 필요)
curl -X GET http://localhost:3000/auth/me \
  -H "Cookie: auth_token=<YOUR_TOKEN>"

# 인증 상태
curl -X GET http://localhost:3000/auth/status \
  -H "Cookie: auth_token=<YOUR_TOKEN>"
```

### 4. 관리자 API 테스트 (초기 관리자만)

```bash
# 승인 대기 목록
curl -X GET http://localhost:3000/admin/users/pending \
  -H "Cookie: auth_token=<ADMIN_TOKEN>"

# 전체 사용자
curl -X GET http://localhost:3000/admin/users \
  -H "Cookie: auth_token=<ADMIN_TOKEN>"

# 사용자 승인
curl -X POST http://localhost:3000/admin/users/2/approve \
  -H "Cookie: auth_token=<ADMIN_TOKEN>"

# 통계
curl -X GET http://localhost:3000/admin/stats \
  -H "Cookie: auth_token=<ADMIN_TOKEN>"
```

### 5. Nginx 검증 엔드포인트 테스트

```bash
# 일반 사용자 검증
curl -X GET http://localhost:3000/verify \
  -H "Cookie: auth_token=<TOKEN>" \
  -v

# 관리자 검증
curl -X GET http://localhost:3000/verify/admin \
  -H "Cookie: auth_token=<ADMIN_TOKEN>" \
  -v
```

응답 헤더 확인:
```
X-Auth-User-Id: 1
X-Auth-User-Email: admin@example.com
X-Auth-User-Role: admin
```

---

## 🔐 보안 기능

### 1. JWT 토큰
- HttpOnly 쿠키 (XSS 방지)
- Secure flag (production에서 HTTPS만)
- SameSite=lax (CSRF 방지)
- 7일 만료

### 2. 미들웨어 검증
- 토큰 유효성 검사
- 승인 상태 확인
- 관리자 권한 확인

### 3. 감사 로그
- 모든 관리자 활동 기록
- IP 주소 및 User-Agent 추적

---

## 🔄 OAuth 플로우 다이어그램

```
[사용자]
   │
   ├─→ GET /auth/google
   │      │
   │      v
   │   [Google Login]
   │      │
   │      v
   │   GET /auth/google/callback
   │      │
   │      ├─→ 사용자 존재?
   │      │   ├─ YES → 프로필 업데이트
   │      │   └─ NO  → 신규 사용자 생성
   │      │
   │      ├─→ INITIAL_ADMIN_EMAIL?
   │      │   └─ YES → role=admin, status=approved
   │      │
   │      v
   │   JWT 토큰 발급
   │      │
   │      v
   │   쿠키 설정 (auth_token)
   │      │
   │      v
   │   리다이렉트
   │      ├─→ pending → /pending
   │      ├─→ approved → /success
   │      └─→ rejected → /rejected
```

---

## ⚙️ 환경변수 (.env)

새로 추가된 환경변수:
```env
# Frontend
FRONTEND_URL=http://localhost:5173
```

**전체 .env 예시:**
```env
NODE_ENV=development
PORT=3000

GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xyz123
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

JWT_SECRET=<openssl rand -base64 64>
JWT_EXPIRES_IN=7d

SESSION_SECRET=<openssl rand -base64 32>

DATABASE_URL=postgresql://auth_user:auth_password_change_in_production@localhost:5433/auth

INITIAL_ADMIN_EMAIL=your_email@gmail.com

FRONTEND_URL=http://localhost:5173

ALLOWED_ORIGINS=http://localhost,http://localhost:5173,https://hstarsp.net
```

---

## 🚨 문제 해결

### 서버가 시작되지 않음

**확인:**
```bash
# TypeScript 타입 오류 확인
cd backend
npx tsc --noEmit

# 패키지 재설치
rm -rf node_modules package-lock.json
npm install
```

### Google OAuth 실패

**확인:**
1. Google Console에서 Redirect URI 등록:
   - `http://localhost:3000/auth/google/callback`
2. `.env`에 올바른 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 입력
3. Google Console에서 OAuth 동의 화면 설정 완료

### JWT 토큰 검증 실패

**확인:**
1. 쿠키가 브라우저에 저장되었는지 확인 (개발자 도구 → Application → Cookies)
2. JWT_SECRET이 .env에 설정되었는지 확인
3. 토큰 만료 여부 확인 (7일)

### 초기 관리자가 자동 승인되지 않음

**확인:**
```bash
# .env 파일 확인
cat backend/.env | grep INITIAL_ADMIN_EMAIL

# Google 계정 이메일과 일치하는지 확인
```

---

## 📊 데이터베이스 확인

### 사용자 목록 조회

```bash
docker exec auth-db psql -U auth_user -d auth -c "SELECT id, email, role, status, created_at FROM users;"
```

### 감사 로그 조회

```bash
docker exec auth-db psql -U auth_user -d auth -c "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10;"
```

---

## 🎯 다음 단계 (Phase 4)

Phase 3 완료! 다음 단계:

1. **Frontend 구현** (Phase 4)
   - React/Vite 앱 생성
   - Google OAuth 버튼
   - 승인 대기 페이지
   - 관리자 대시보드

2. **Nginx 통합** (Phase 5)
   - auth_request 설정
   - my-realestate-calc 보호
   - 쿠키 전달 설정

3. **배포** (Phase 6)
   - Docker 이미지 빌드
   - Docker Compose 프로덕션 설정
   - HTTPS 설정

---

**Phase 3 Status**: ✅ Google OAuth & JWT Implementation Complete
**Next**: Phase 4 - Frontend Development
**Last Updated**: 2025-11-22
