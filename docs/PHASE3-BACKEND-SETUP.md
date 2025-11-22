# Phase 3: Backend Setup Guide

## 📋 개요

**Node.js + Express + TypeScript 기반 인증 백엔드**를 구축합니다.
Google OAuth 2.0, JWT 인증, PostgreSQL 연동을 포함합니다.

## 🎯 Phase 3 목표

### 구축할 것들

```
backend/
├── 📦 Node.js 프로젝트 초기화
├── 🔧 TypeScript 설정
├── 🚀 Express 서버 기본 구조
├── 🔌 PostgreSQL 연결
├── 🔐 Google OAuth 2.0 설정
└── 🎫 JWT 토큰 관리
```

### 핵심 기능
✅ **Google OAuth 2.0 로그인**
✅ **JWT 기반 세션 관리**
✅ **PostgreSQL 데이터베이스 연동**
✅ **사용자 관리 (CRUD)**
✅ **관리자 승인 플로우**

---

## 🚀 빠른 시작

### 1. 백엔드 폴더로 이동

```bash
cd /Users/seonpillhwang/GitHub/homegroup/auth-service/backend
```

### 2. package.json 생성 (자동)

```bash
# 자동으로 생성됨
npm install
```

### 3. 환경변수 설정

```bash
cp .env.example .env
nano .env
```

### 4. 개발 서버 시작

```bash
npm run dev
```

---

## ✅ 사용자가 직접 해야할 작업

### 작업 1: Google OAuth 2.0 설정

#### 1-1. Google Cloud Console 접속

https://console.cloud.google.com/

#### 1-2. 프로젝트 생성

1. 상단 프로젝트 선택 → "새 프로젝트"
2. 프로젝트 이름: `auth-service` (또는 원하는 이름)
3. "만들기" 클릭

#### 1-3. OAuth 동의 화면 구성

1. **왼쪽 메뉴**: "API 및 서비스" → "OAuth 동의 화면"
2. **User Type**: "외부" 선택 → "만들기"
3. **앱 정보**:
   - 앱 이름: `Auth Service`
   - 사용자 지원 이메일: `your_email@gmail.com`
   - 개발자 연락처: `your_email@gmail.com`
4. **범위**: "저장 후 계속" (기본값 사용)
5. **테스트 사용자**: 본인 이메일 추가
6. "저장 후 계속"

#### 1-4. OAuth 클라이언트 ID 만들기

1. **왼쪽 메뉴**: "API 및 서비스" → "사용자 인증 정보"
2. **"+ 사용자 인증 정보 만들기"** → "OAuth 클라이언트 ID"
3. **애플리케이션 유형**: "웹 애플리케이션"
4. **이름**: `Auth Service Web`
5. **승인된 리디렉션 URI 추가**:
   ```
   http://localhost:3000/auth/google/callback
   https://hstarsp.net/auth/google/callback
   ```
6. **"만들기"** 클릭
7. **클라이언트 ID와 클라이언트 보안 비밀번호 복사** ⭐ 중요!

#### 1-5. .env 파일에 추가

```env
GOOGLE_CLIENT_ID=복사한_클라이언트_ID
GOOGLE_CLIENT_SECRET=복사한_클라이언트_보안_비밀번호
```

---

### 작업 2: JWT Secret 생성

```bash
# 강력한 랜덤 문자열 생성
openssl rand -base64 64

# 출력된 문자열을 .env에 추가
JWT_SECRET=생성된_랜덤_문자열
```

---

### 작업 3: 초기 관리자 이메일 설정

`.env` 파일에 본인의 Google 이메일 추가:

```env
INITIAL_ADMIN_EMAIL=your_email@gmail.com
```

---

## 📦 설치된 패키지

### Core Dependencies

```json
{
  "express": "^4.18.2",
  "typescript": "^5.3.3",
  "ts-node": "^10.9.2",
  "dotenv": "^16.3.1"
}
```

### Database

```json
{
  "pg": "^8.11.3",
  "@types/pg": "^8.10.9"
}
```

### Authentication

```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "jsonwebtoken": "^9.0.2",
  "express-session": "^1.17.3",
  "connect-pg-simple": "^9.0.1"
}
```

### Security & Validation

```json
{
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.1.5",
  "bcrypt": "^5.1.1"
}
```

### Development

```json
{
  "nodemon": "^3.0.2",
  "@types/express": "^4.17.21",
  "@types/node": "^20.10.6",
  "ts-node-dev": "^2.0.0"
}
```

---

## 📂 백엔드 구조

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts              # Google OAuth 라우트
│   │   ├── verify.ts            # JWT 검증 (Nginx용)
│   │   └── admin.ts             # 관리자 API
│   │
│   ├── middleware/
│   │   ├── jwt.ts               # JWT 검증 미들웨어
│   │   ├── admin.ts             # 관리자 권한 체크
│   │   └── errorHandler.ts     # 에러 핸들러
│   │
│   ├── services/
│   │   ├── googleOAuth.ts       # Google OAuth 로직
│   │   ├── jwt.ts               # JWT 토큰 관리
│   │   └── user.ts              # 사용자 관리
│   │
│   ├── db/
│   │   ├── connection.ts        # PostgreSQL 연결 풀
│   │   ├── queries.ts           # SQL 쿼리 함수
│   │   └── migrations/
│   │
│   ├── types/
│   │   └── index.ts             # TypeScript 타입 정의
│   │
│   ├── config/
│   │   └── index.ts             # 환경변수 로더
│   │
│   └── server.ts                # Express 서버 진입점
│
├── package.json
├── tsconfig.json
├── .env
├── .env.example
└── Dockerfile
```

---

## 🔧 주요 파일 설명

### 1. server.ts (진입점)

```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));
app.use(express.json());
app.use(session({ /* ... */ }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/verify', verifyRoutes);
app.use('/admin', adminRoutes);

// Start server
app.listen(3000, () => {
  console.log('Auth service running on port 3000');
});
```

### 2. config/index.ts (환경변수)

```typescript
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),

  database: {
    url: process.env.DATABASE_URL!,
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL!,
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  initialAdmin: {
    email: process.env.INITIAL_ADMIN_EMAIL!,
  },
};
```

### 3. db/connection.ts (DB 연결)

```typescript
import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
  process.exit(-1);
});
```

---

## 🔐 API 엔드포인트

### 인증 API

#### POST /auth/google
Google OAuth 로그인 시작

**Response**: Redirect to Google

#### GET /auth/google/callback
Google OAuth 콜백

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "status": "pending"
  }
}
```

#### GET /auth/me
현재 사용자 정보

**Headers**: Cookie (JWT)

**Response**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "role": "user",
  "status": "approved"
}
```

#### POST /auth/logout
로그아웃

### 검증 API (Nginx용)

#### GET /verify
JWT 검증

**Response Headers**:
- X-User-Id
- X-User-Email
- X-User-Role
- X-User-Status

### 관리자 API

#### GET /admin/users/pending
승인 대기 사용자 목록

#### POST /admin/users/:id/approve
사용자 승인

#### POST /admin/users/:id/reject
사용자 거부

---

## 🧪 테스트

### 1. 서버 시작 확인

```bash
npm run dev

# 출력:
# Auth service running on port 3000
# Database connected
```

### 2. Health Check

```bash
curl http://localhost:3000/health

# 출력:
# {"status":"ok"}
```

### 3. 데이터베이스 연결 확인

```bash
curl http://localhost:3000/db/health

# 출력:
# {"database":"connected","timestamp":"2025-11-22T..."}
```

---

## 🔍 확인 체크리스트

Phase 3 완료 전 확인:

- [ ] Google OAuth 클라이언트 ID/Secret 발급
- [ ] .env 파일 설정 완료
- [ ] `npm install` 성공
- [ ] `npm run dev` 서버 시작 성공
- [ ] 데이터베이스 연결 확인
- [ ] /health 엔드포인트 응답 확인
- [ ] TypeScript 컴파일 오류 없음

---

## 🚨 트러블슈팅

### 문제 1: Database connection failed

```
Error: Connection terminated unexpectedly
```

**해결**:
```bash
# auth-db 컨테이너 확인
docker ps | grep auth-db

# .env DATABASE_URL 확인
cat .env | grep DATABASE_URL
# 올바른 형식: postgresql://auth_user:password@localhost:5433/auth
```

### 문제 2: Google OAuth error

```
Error: redirect_uri_mismatch
```

**해결**:
1. Google Console → OAuth 클라이언트 ID
2. 승인된 리디렉션 URI 확인
3. 정확히 `http://localhost:3000/auth/google/callback` 추가

### 문제 3: JWT secret missing

```
Error: JWT_SECRET is not defined
```

**해결**:
```bash
# JWT_SECRET 생성
openssl rand -base64 64

# .env에 추가
echo "JWT_SECRET=생성된_문자열" >> .env
```

---

## 📝 다음 단계 (Phase 4)

Phase 3 완료 후:
- [ ] Frontend 개발 (React 컴포넌트)
- [ ] 로그인 모달 UI
- [ ] 관리자 대시보드
- [ ] Nginx 통합

---

**Last Updated**: 2025-11-22
**Status**: Ready to Start
**Tech Stack**: Node.js 18, TypeScript 5, Express 4, PostgreSQL 16
