# Phase 2: Database Setup Guide

## 📋 개요

**auth-service는 완전히 독립적인 PostgreSQL 컨테이너**를 사용합니다.
기존 `realestate-pg`와 분리하여 재사용성과 이식성을 극대화합니다.

## 🎯 데이터베이스 전략

### 선택한 방법: 완전 독립적인 PostgreSQL 컨테이너

```
Docker Containers:
├── realestate-pg (포트 5432)
│   └── realestate 데이터베이스 (부동산 계산기용)
│
└── auth-db (포트 5433) ← 새로 생성
    └── auth 데이터베이스 (인증 서비스용)
```

### 장점
✅ **완전한 독립성**: 다른 프로젝트에서도 auth-service만 복사하면 즉시 사용 가능
✅ **이식성**: Docker Compose로 어디서나 동일하게 실행
✅ **리소스 격리**: CPU, 메모리, 연결 풀이 완전히 분리
✅ **장애 격리**: auth-db 문제가 realestate-pg에 영향 없음
✅ **백업/복구 독립적**: 각 서비스별로 독립적인 백업 정책
✅ **버전 관리**: 각 서비스가 필요한 PostgreSQL 버전 사용 가능
✅ **재사용성**: 다른 프로젝트에서 auth-service 서브모듈만 추가하면 즉시 사용

### 포트 구성
- `realestate-pg`: 5432 (기존 부동산 계산기용)
- `auth-db`: 5433 (auth-service 전용)

---

## 🚀 빠른 시작

### 1. Docker Compose로 시작

```bash
cd auth-service
docker compose up -d auth-db
```

### 2. 데이터베이스 상태 확인

```bash
# 컨테이너 상태
docker ps | grep auth-db

# 로그 확인
docker logs auth-db

# 데이터베이스 연결 테스트
docker exec auth-db psql -U auth_user -d auth -c "SELECT version();"
```

### 3. 테이블 확인

```bash
# 생성된 테이블 목록
docker exec auth-db psql -U auth_user -d auth -c "\dt"

# users 테이블 구조
docker exec auth-db psql -U auth_user -d auth -c "\d users"
```

---

## ✅ 사용자가 직접 해야할 작업

### 작업 1: 환경변수 설정

`.env` 파일 생성:

```bash
cd auth-service
cp .env.example .env
nano .env
```

`.env` 내용:
```env
# 강력한 비밀번호로 변경하세요!
AUTH_DB_PASSWORD=여기에_복잡한_비밀번호_입력
```

**비밀번호 생성:**
```bash
openssl rand -base64 32
```

### 작업 2: 데이터베이스 시작

```bash
cd auth-service
docker compose up -d auth-db
```

### 작업 3: 검증

```bash
# 컨테이너 실행 확인
docker ps | grep auth-db

# 헬스체크 확인
docker inspect auth-db --format='{{.State.Health.Status}}'
# 출력: healthy

# 테이블 확인
docker exec auth-db psql -U auth_user -d auth -c "\dt"
```

---

## 📊 데이터베이스 구조

### auth 데이터베이스에 생성된 테이블

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|-----------|
| **users** | 사용자 정보 | google_id, email, name, role, status |
| **sessions** | 세션 저장 | sid, sess, expire |
| **audit_log** | 관리자 활동 로그 | admin_id, action, target_user_id |

---

## 🔌 연결 설정

### Backend 애플리케이션 연결

**backend/.env:**
```env
# 로컬 개발 (Docker 외부에서)
DATABASE_URL=postgresql://auth_user:your_password@localhost:5433/auth

# Docker Compose 내부에서
DATABASE_URL=postgresql://auth_user:your_password@auth-db:5432/auth
```

---

## 🛡️ 보안 주의사항

1. **`.env` 파일은 절대 Git에 커밋하지 마세요**
   - `.gitignore`에 이미 포함되어 있음

2. **프로덕션에서는 강력한 비밀번호 사용**
   - 최소 32자 이상
   - 영문 대소문자, 숫자, 특수문자 조합

3. **포트 노출 제한 (프로덕션)**
   - docker-compose.yml에서 ports 섹션 제거
   - Docker 내부에서만 접근하도록 설정

---

## 📝 다음 단계 (Phase 3)

- Node.js Backend 프로젝트 초기화
- PostgreSQL 클라이언트 설정
- 데이터베이스 연결 테스트

---

**Last Updated**: 2025-11-22
**Database**: PostgreSQL 16 Alpine
**Port**: 5433 (External), 5432 (Internal)
