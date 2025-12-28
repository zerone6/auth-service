# Auth Service Backend 구조

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | 18+ | 런타임 |
| Express | 4.18 | 웹 프레임워크 |
| TypeScript | 5.3 | 정적 타입 |
| Passport.js | 0.7 | OAuth 인증 |
| PostgreSQL | 16 | 데이터베이스 |
| JWT | 9.0 | 토큰 기반 인증 |

---

## 프로젝트 구조

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts              # 인증 라우트 (Google OAuth)
│   │   ├── verify.ts            # JWT 검증 (Nginx auth_request용)
│   │   └── admin.ts             # 관리자 API
│   │
│   ├── middleware/
│   │   ├── auth.ts              # 인증 미들웨어
│   │   └── errorHandler.ts      # 중앙 집중식 에러 핸들러
│   │
│   ├── services/
│   │   ├── jwt.ts               # JWT 토큰 관리
│   │   └── passport.ts          # Passport.js 설정
│   │
│   ├── db/
│   │   ├── connection.ts        # PostgreSQL 연결 풀
│   │   └── queries.ts           # 사용자 관련 쿼리
│   │
│   ├── config/
│   │   └── index.ts             # 환경변수 설정
│   │
│   ├── types/
│   │   └── express.d.ts         # Express 타입 확장
│   │
│   └── server.ts                # Express 서버 진입점
│
├── run-migration.js             # 마이그레이션 실행 스크립트
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## API 엔드포인트

### 인증 API (`/auth`)

| 메소드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|----------|
| GET | `/auth/google` | Google OAuth 시작 | X |
| GET | `/auth/google/callback` | Google OAuth 콜백 | X |
| GET | `/auth/failure` | 인증 실패 | X |
| POST | `/auth/logout` | 로그아웃 | X |
| GET | `/auth/me` | 현재 사용자 정보 | O |
| GET | `/auth/status` | 인증 상태 확인 | O |

### 검증 API (`/verify`)

Nginx auth_request 지시어용 엔드포인트

| 메소드 | 경로 | 설명 | 응답 |
|--------|------|------|------|
| GET | `/verify` | 승인된 사용자 검증 | 200/401/403 |
| GET | `/verify/admin` | 관리자 검증 | 200/401/403 |

**응답 헤더** (200 OK 시):
- `X-Auth-User-Id`: 사용자 ID
- `X-Auth-User-Email`: 이메일
- `X-Auth-User-Role`: 역할

### 관리자 API (`/admin`)

모든 엔드포인트는 `requireAuth` + `requireAdmin` 미들웨어 적용

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | `/admin/users` | 전체 사용자 목록 (?status=pending\|approved\|rejected) |
| GET | `/admin/users/pending` | 승인 대기 사용자 목록 |
| POST | `/admin/users/:id/approve` | 사용자 승인 |
| POST | `/admin/users/:id/reject` | 사용자 거부 |
| GET | `/admin/audit-logs` | 감사 로그 (?limit=100&offset=0) |
| GET | `/admin/stats` | 사용자 통계 |

### 헬스 체크 API

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서비스 상태 |
| GET | `/db/health` | 데이터베이스 연결 상태 |

---

## 미들웨어

### 인증 미들웨어 (`src/middleware/auth.ts`)

| 미들웨어 | 용도 |
|----------|------|
| `requireAuth` | JWT 인증 필수 (쿠키 또는 Authorization 헤더) |
| `requireAdmin` | 관리자 역할 필수 |
| `requireApproved` | 승인된 사용자만 허용 |

**토큰 위치 우선순위**:
1. Cookie: `auth_token`
2. Header: `Authorization: Bearer <token>`

### 에러 핸들러 미들웨어 (`src/middleware/errorHandler.ts`)

중앙 집중식 에러 처리를 위한 미들웨어 및 유틸리티.

**에러 클래스 계층구조**:

| 클래스 | HTTP 상태 | 코드 | 용도 |
|--------|----------|------|------|
| `AppError` | - | - | 기본 에러 클래스 |
| `UnauthorizedError` | 401 | UNAUTHORIZED | 인증 필요 |
| `ForbiddenError` | 403 | FORBIDDEN | 접근 거부 |
| `NotFoundError` | 404 | NOT_FOUND | 리소스 없음 |
| `BadRequestError` | 400 | BAD_REQUEST | 잘못된 요청 |
| `ValidationError` | 422 | VALIDATION_ERROR | 유효성 검사 실패 |
| `ConflictError` | 409 | CONFLICT | 리소스 충돌 |
| `InternalError` | 500 | INTERNAL_ERROR | 내부 서버 오류 |

**유틸리티 함수**:

| 함수 | 용도 |
|------|------|
| `asyncHandler(fn)` | async 라우트 핸들러 래퍼 (에러 자동 catch) |
| `errorHandler(err, req, res, next)` | 중앙 집중식 에러 핸들러 |
| `notFoundHandler(req, res, next)` | 404 Not Found 핸들러 |
| `sendSuccess(res, data, statusCode)` | 표준화된 성공 응답 헬퍼 |

**표준 API 응답 형식**:

```typescript
// 성공 응답
{
  success: true,
  data: { ... },
  timestamp: "2025-12-28T12:00:00.000Z"
}

// 에러 응답
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "User not found",
    details?: { ... }  // development 환경에서만
  },
  timestamp: "2025-12-28T12:00:00.000Z",
  path: "/admin/users/123"
}
```

---

## 서비스

### JWT 서비스 (`src/services/jwt.ts`)

| 함수 | 설명 |
|------|------|
| `generateToken(user)` | JWT 토큰 생성 (7일 만료) |
| `verifyToken(token)` | JWT 토큰 검증 |

**JWT Payload 구조**:
```typescript
{
  userId: number;
  email: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
}
```

### Passport 서비스 (`src/services/passport.ts`)

- Google OAuth 2.0 Strategy 설정
- 기존 사용자: 프로필 업데이트
- 신규 사용자: 자동 생성
- 초기 관리자(`INITIAL_ADMIN_EMAIL`): 자동 `admin` + `approved` 부여

---

## 데이터베이스

### 연결 설정 (`src/db/connection.ts`)

- PostgreSQL 연결 풀 사용
- 환경변수 `DATABASE_URL`로 연결 문자열 설정

### 테이블 구조

#### users 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | Primary Key |
| google_id | VARCHAR(255) | Google OAuth ID (UNIQUE) |
| email | VARCHAR(255) | 이메일 (UNIQUE) |
| name | VARCHAR(255) | 이름 |
| picture_url | TEXT | 프로필 이미지 URL |
| role | VARCHAR(50) | 역할: `admin` / `user` |
| status | VARCHAR(50) | 상태: `pending` / `approved` / `rejected` |
| created_at | TIMESTAMP | 생성일 |
| updated_at | TIMESTAMP | 수정일 |
| approved_at | TIMESTAMP | 승인일 |
| approved_by | INTEGER | 승인한 관리자 ID (FK) |

#### sessions 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| sid | VARCHAR(255) | Session ID (PK) |
| sess | JSON | 세션 데이터 |
| expire | TIMESTAMP | 만료 시간 |

#### audit_log 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | Primary Key |
| admin_id | INTEGER | 관리자 ID (FK) |
| action | VARCHAR(100) | 수행한 작업 |
| target_user_id | INTEGER | 대상 사용자 ID (FK) |
| details | JSONB | 상세 정보 |
| ip_address | INET | IP 주소 |
| user_agent | TEXT | User-Agent |
| created_at | TIMESTAMP | 생성일 |

### 주요 쿼리 함수 (`src/db/queries.ts`)

| 함수 | 설명 |
|------|------|
| `findUserByGoogleId(googleId)` | Google ID로 사용자 검색 |
| `findUserByEmail(email)` | 이메일로 사용자 검색 |
| `findUserById(id)` | ID로 사용자 검색 |
| `createUser(userData)` | 신규 사용자 생성 |
| `updateUserProfile(userId, profileData)` | 프로필 업데이트 |
| `approveUser(userId, adminId)` | 사용자 승인 |
| `rejectUser(userId, adminId)` | 사용자 거부 |
| `getPendingUsers()` | 승인 대기 목록 |
| `getAllUsers(status?)` | 전체 사용자 목록 |
| `logAuditAction(actionData)` | 감사 로그 기록 |
| `getAuditLogs(limit, offset)` | 감사 로그 조회 |

---

## 환경변수

### 필수 환경변수

| 변수 | 설명 |
|------|------|
| `NODE_ENV` | 실행 환경 (development / production) |
| `PORT` | 서버 포트 (기본: 3000) |
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 Secret |
| `GOOGLE_CALLBACK_URL` | Google OAuth 콜백 URL |
| `JWT_SECRET` | JWT 서명 키 |
| `JWT_EXPIRES_IN` | JWT 만료 시간 (기본: 7d) |
| `SESSION_SECRET` | 세션 서명 키 |
| `INITIAL_ADMIN_EMAIL` | 초기 관리자 이메일 |
| `FRONTEND_URL` | 프론트엔드 URL |
| `ALLOWED_ORIGINS` | CORS 허용 Origin (쉼표 구분) |
| `AUTH_DB_PASSWORD` | PostgreSQL 비밀번호 (Docker Compose용) |

### 환경변수 파일

모든 환경변수는 `backend/.env.example`에 통합되어 있습니다:
- Backend 설정: Google OAuth, JWT, Session, Database 등
- Docker Compose 설정: `AUTH_DB_PASSWORD`

### 환경변수 예시

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://auth_user:password@localhost:5433/auth

GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xyz123
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

JWT_SECRET=<openssl rand -base64 64 결과>
JWT_EXPIRES_IN=7d

SESSION_SECRET=<openssl rand -base64 32 결과>

INITIAL_ADMIN_EMAIL=admin@example.com

FRONTEND_URL=http://localhost:5173

ALLOWED_ORIGINS=http://localhost,http://localhost:5173
```

---

## 프로젝트 설정 및 실행

### 설치

```bash
cd backend
npm install
```

### 환경변수 설정

```bash
cp .env.example .env
# .env 파일 편집
```

### 개발 서버 실행

```bash
# auth-db가 먼저 실행되어야 함
npm run dev

# 서버 시작 시 출력:
# 🔐 Auth Service Backend
# Environment: development
# Port: 3000
# Database: ✅ Connected
```

### 프로덕션 빌드

```bash
npm run build

# 빌드 결과: dist/ 폴더
```

### 프로덕션 실행

```bash
npm start

# 또는
node dist/server.js
```

---

## Docker 빌드

### Dockerfile 구조

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

### 빌드 명령

```bash
docker build -t auth-backend .
docker run -p 3000:3000 --env-file .env auth-backend
```

---

## 보안 설정

### 사용 중인 보안 미들웨어

| 미들웨어 | 용도 |
|----------|------|
| Helmet | HTTP 보안 헤더 설정 |
| CORS | Cross-Origin 요청 제어 |
| Cookie-parser | 쿠키 파싱 |

### JWT 쿠키 설정

| 옵션 | 값 | 설명 |
|------|-----|------|
| httpOnly | true | JavaScript에서 접근 불가 |
| secure | production에서 true | HTTPS에서만 전송 |
| sameSite | lax | CSRF 방지 |
| maxAge | 7일 | 쿠키 만료 시간 |

### 감사 로그

관리자 활동은 자동으로 `audit_log` 테이블에 기록됩니다:
- 승인 (`approve_user`)
- 거부 (`reject_user`)
- IP 주소, User-Agent 포함

---

## 트러블슈팅

### 데이터베이스 연결 실패

**증상**: `Error: Connection terminated unexpectedly`

**확인사항**:
1. PostgreSQL 컨테이너 실행 확인: `docker ps | grep auth-db`
2. `DATABASE_URL` 형식 확인: `postgresql://user:password@host:port/database`
3. 네트워크 연결 확인

### Google OAuth 오류

**증상**: `redirect_uri_mismatch`

**확인사항**:
1. Google Console의 승인된 리디렉션 URI 확인
2. `.env`의 `GOOGLE_CALLBACK_URL` 확인
3. URL이 정확히 일치하는지 확인 (슬래시 포함)

### JWT 검증 실패

**증상**: `/verify`에서 401 응답

**확인사항**:
1. `auth_token` 쿠키가 전달되는지 확인
2. JWT 토큰 만료 여부 확인 (7일)
3. `JWT_SECRET` 환경변수가 올바른지 확인

### 초기 관리자 자동 승인 안 됨

**증상**: `INITIAL_ADMIN_EMAIL`로 로그인했는데 `pending` 상태

**확인사항**:
1. `.env`의 `INITIAL_ADMIN_EMAIL`이 정확한지 확인
2. 이메일이 정확히 일치하는지 확인 (대소문자 포함)
3. 서버 재시작 후 다시 시도

---

## TypeScript 설정

### tsconfig.json 주요 설정

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node10",
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Express 타입 확장 (`src/types/express.d.ts`)

```typescript
interface User {
  // From JwtPayload (set by requireAuth middleware)
  userId?: number;
  email: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  // From DbUser (set by Passport)
  id?: number;
  google_id?: string;
  name?: string | null;
  picture_url?: string | null;
  // ... timestamps
}
```

---

## 테스트

### 테스트 환경

| 항목 | 설정 |
|------|------|
| 테스트 프레임워크 | Jest + ts-jest |
| HTTP 테스트 | Supertest |
| 커버리지 | Istanbul (jest --coverage) |

### 테스트 실행

```bash
npm test           # 테스트 실행
npm run test:watch # Watch 모드
npm run test:coverage # 커버리지 리포트
```

### 테스트 결과 요약

| 테스트 파일 | 테스트 케이스 | 상태 |
|-------------|---------------|------|
| jwt.test.ts | 11개 | ✅ Pass |
| auth.test.ts (middleware) | 15개 | ✅ Pass |
| health.test.ts | 4개 | ✅ Pass |
| verify.test.ts | 10개 | ✅ Pass |
| auth.test.ts (routes) | 4개 (+ 4 skipped) | ✅ Pass |
| **총계** | **44개 (+ 4 skipped)** | **100% Pass** |

---

## API 문서화 (Swagger/OpenAPI)

### 접근 방법

개발 환경에서 Swagger UI를 통해 API 문서를 확인할 수 있습니다:

```
http://localhost:3000/api-docs
```

OpenAPI 3.0 JSON 스펙:
```
http://localhost:3000/api-docs.json
```

### 구성 파일

| 파일 | 설명 |
|------|------|
| `src/config/swagger.ts` | OpenAPI 스펙 설정 (스키마, 보안, 태그 등) |
| `src/routes/*.ts` | JSDoc 주석으로 API 명세 정의 |

### 사용된 패키지

| 패키지 | 용도 |
|--------|------|
| swagger-jsdoc | JSDoc 주석에서 OpenAPI 스펙 생성 |
| swagger-ui-express | Swagger UI 호스팅 |

---

## TODO: 코드 레벨 개선 필요 항목

### 완료된 항목 ✅

- ~~공통 에러 핸들러 미들웨어 강화~~ (2025-12-28)
- ~~표준화된 에러 응답 형식 적용~~ (2025-12-28)
- ~~Swagger/OpenAPI 문서 추가~~ (2025-12-28)

---

## 참고 문서

- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 전체 프로젝트 구조
- [FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md) - 프론트엔드 상세 구조
- [refactoring_result.md](./refactoring_result.md) - 리팩토링 내역 및 TODO

---

**Last Updated**: 2025-12-28
