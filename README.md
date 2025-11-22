# Auth Service

**독립적이고 재사용 가능한 SSO 기반 인증/인가 서비스**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/react-18.x-blue.svg)](https://reactjs.org/)

## 📋 개요

Auth Service는 Google OAuth 2.0 기반의 독립적인 인증 서비스로, Nginx `auth_request`를 통해 다양한 프로젝트에 쉽게 통합할 수 있습니다.

### 주요 기능

- ✅ **Google OAuth 2.0** 로그인
- ✅ **관리자 승인 기반** 접근 제어
- ✅ **JWT 기반 세션** 관리
- ✅ **Nginx auth_request** 통합
- ✅ **재사용 가능한 컴포넌트**
- ✅ **Docker 지원**

## 🏗️ 아키텍처

```
Internet → Nginx → Auth Service → Protected Services
                      ↓
                   PostgreSQL
```

- **Backend**: Node.js + Express + Passport.js
- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL 16
- **인증**: Google OAuth 2.0 + JWT

## 🚀 빠른 시작

### 1. 서브모듈로 추가

```bash
cd your-project
git submodule add https://github.com/zerone6/auth-service.git
git submodule update --init --recursive
```

### 2. 환경변수 설정

```bash
cd auth-service
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env` 파일 수정:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback
JWT_SECRET=your_strong_secret_key
DATABASE_URL=postgresql://user:password@auth-db:5432/auth
INITIAL_ADMIN_EMAIL=your_email@gmail.com
```

### 3. Docker Compose로 실행

```bash
docker compose up -d
```

### 4. Nginx 설정

```nginx
# auth_request 추가
location /protected/ {
    auth_request /auth-verify;
    # ... 나머지 설정
}

location = /auth-verify {
    internal;
    proxy_pass http://auth-backend:3000/verify;
}
```

## 📁 프로젝트 구조

```
auth-service/
├── backend/          # Node.js 인증 백엔드
├── frontend/         # React 관리자 대시보드
├── database/         # PostgreSQL 스키마
├── docs/            # 문서
└── docker-compose.yml
```

## 📖 문서

- [📋 개발 계획서](docs/AUTH-DEV-PLAN.md)
- [🏗️ 아키텍처](docs/ARCHITECTURE.md)
- [🔌 API 명세](docs/API.md)
- [🔧 통합 가이드](docs/INTEGRATION.md)
- [🚀 배포 가이드](docs/DEPLOYMENT.md)

## 🔐 보안

- HttpOnly + Secure + SameSite Cookie
- JWT 토큰 기반 인증
- HTTPS 강제
- SQL Injection 방지
- XSS/CSRF 방지

## 📊 개발 상태

### Phase 1: 초기 설정 ✅
- [x] 프로젝트 구조 생성
- [x] 설계 문서 작성

### Phase 2-10: 개발 중 🚧
자세한 로드맵은 [AUTH-DEV-PLAN.md](docs/AUTH-DEV-PLAN.md)를 참조하세요.

## 🤝 기여

이 프로젝트는 개인 프로젝트이지만, 이슈와 제안은 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

Private - Personal use only

## 📞 Contact

- **Developer**: zerone6
- **Repository**: https://github.com/zerone6/auth-service
- **Issues**: https://github.com/zerone6/auth-service/issues

---

**Made with ❤️ for secure authentication**
