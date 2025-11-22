# Phase 1: Initial Setup Guide

## 📋 개요

**auth-service 프로젝트의 초기 구조와 설계 문서**를 생성합니다.
Git 저장소, 폴더 구조, 개발 계획서를 포함한 프로젝트 기반을 구축합니다.

## 🎯 Phase 1 목표

### 생성할 것들

```
auth-service/
├── 📁 프로젝트 구조
├── 📄 설계 문서 (AUTH-DEV-PLAN.md)
├── 🗂️ Git 저장소 및 서브모듈 설정
└── 📋 환경변수 템플릿
```

### 핵심 원칙
✅ **독립성**: 다른 프로젝트에서 재사용 가능한 구조
✅ **확장성**: 향후 기능 추가가 용이한 폴더 구조
✅ **문서화**: 모든 의사결정과 설계를 문서로 기록
✅ **모듈화**: Backend, Frontend, Database 완전 분리

---

## 🚀 빠른 시작

### 1. GitHub 저장소 생성

```bash
# GitHub에서 저장소 생성
# Repository name: auth-service
# Description: Independent SSO-based authentication service
# Visibility: Public (또는 Private)
```

### 2. homegroup에 서브모듈 추가

```bash
cd /Users/seonpillhwang/GitHub/homegroup
git submodule add https://github.com/zerone6/auth-service.git
git submodule update --init --recursive
```

### 3. 폴더 구조 생성

```bash
cd auth-service

# Backend 폴더 구조
mkdir -p backend/src/{routes,middleware,services,db,types,config}

# Frontend 폴더 구조
mkdir -p frontend/src/{components,hooks,services,types}

# Database 폴더 구조
mkdir -p database/{seeds,migrations}

# 문서 폴더
mkdir -p docs
```

### 4. 초기 파일 생성

```bash
# .gitkeep 파일 추가 (빈 폴더 추적)
find . -type d -empty -exec touch {}/.gitkeep \;

# Git에 추가
git add .
git commit -m "feat: Phase 1 - Initial project structure"
git push -u origin main

# dev 브랜치 생성 및 전환
git checkout -b dev
git push -u origin dev
```

---

## 📊 생성된 폴더 구조

```
auth-service/
│
├── backend/                            # 인증 백엔드
│   ├── src/
│   │   ├── routes/                    # API 라우트
│   │   │   └── .gitkeep
│   │   ├── middleware/                # Express 미들웨어
│   │   │   └── .gitkeep
│   │   ├── services/                  # 비즈니스 로직
│   │   │   └── .gitkeep
│   │   ├── db/                        # 데이터베이스 관련
│   │   │   └── .gitkeep
│   │   ├── types/                     # TypeScript 타입
│   │   │   └── .gitkeep
│   │   └── config/                    # 설정 파일
│   │       └── .gitkeep
│   └── .env.example                   # 환경변수 템플릿
│
├── frontend/                           # 인증 UI
│   ├── src/
│   │   ├── components/                # React 컴포넌트
│   │   │   └── .gitkeep
│   │   ├── hooks/                     # Custom Hooks
│   │   │   └── .gitkeep
│   │   ├── services/                  # API 클라이언트
│   │   │   └── .gitkeep
│   │   └── types/                     # TypeScript 타입
│   │       └── .gitkeep
│   └── .env.example                   # 환경변수 템플릿
│
├── database/
│   ├── schema.sql                     # 데이터베이스 스키마
│   ├── seeds/                         # 초기 데이터
│   │   └── initial-admin.sql
│   └── migrations/                    # 마이그레이션 (향후)
│       └── .gitkeep
│
├── docs/
│   ├── AUTH-DEV-PLAN.md              # 전체 개발 계획 (1,225줄)
│   ├── PHASE1-INITIAL-SETUP.md       # 이 문서
│   └── .gitkeep
│
├── .gitignore                         # Git 제외 파일
├── README.md                          # 프로젝트 소개
└── .env.example                       # 루트 환경변수 템플릿
```

---

## 📄 생성된 주요 파일들

### 1. AUTH-DEV-PLAN.md (전체 개발 계획서)

**위치**: `docs/AUTH-DEV-PLAN.md`

**내용** (1,225줄):
- 프로젝트 개요 및 목적
- 시스템 아키텍처 설계
- 데이터베이스 스키마
- API 엔드포인트 명세
- Nginx 설정
- Phase 1-10 개발 단계
- 보안 고려사항
- 재사용 가이드
- 성능 최적화
- 테스트 전략

### 2. README.md (프로젝트 소개)

**위치**: `README.md`

**내용**:
- 프로젝트 개요
- 주요 기능
- 빠른 시작 가이드
- 아키텍처 다이어그램
- 문서 링크
- 기여 가이드

### 3. database/schema.sql (DB 스키마)

**위치**: `database/schema.sql`

**내용**:
- users 테이블 (사용자 정보)
- sessions 테이블 (세션 저장)
- audit_log 테이블 (관리자 활동 로그)
- 인덱스, 트리거, 제약조건

### 4. .gitignore

**위치**: `.gitignore`

**제외 파일**:
- node_modules/
- .env, .env.local
- dist/, build/
- *.log
- .DS_Store
- 기타 임시 파일

### 5. .env.example (환경변수 템플릿)

**backend/.env.example**:
```env
NODE_ENV=development
PORT=3000

GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost/auth/google/callback

JWT_SECRET=your_very_strong_secret_key
JWT_EXPIRES_IN=7d

DATABASE_URL=postgresql://auth_user:auth@auth-db:5432/auth

INITIAL_ADMIN_EMAIL=your_email@gmail.com

ALLOWED_ORIGINS=http://localhost,https://hstarsp.net
```

**frontend/.env.example**:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_NODE_ENV=development
```

---

## 🔧 Git 설정

### .gitmodules 설정

**homegroup/.gitmodules**:
```gitmodules
[submodule "auth-service"]
	path = auth-service
	url = https://github.com/zerone6/auth-service.git
	branch = dev
```

### 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| **main** | 안정 버전 (프로덕션 배포) |
| **dev** | 개발 중인 기능 (Phase 진행) |
| **feature/** | 새로운 기능 개발 |

---

## ✅ 사용자가 직접 해야할 작업

### 작업 1: GitHub 저장소 생성

1. https://github.com/new 접속
2. Repository name: `auth-service`
3. Description: `Independent SSO-based authentication service`
4. Visibility: Public 또는 Private 선택
5. **Create repository** 클릭

### 작업 2: 서브모듈 추가 확인

```bash
cd /Users/seonpillhwang/GitHub/homegroup

# 서브모듈 상태 확인
git submodule status

# 예상 출력:
# 0e2d2a15... auth-service (heads/dev)
```

### 작업 3: 문서 확인

```bash
cd auth-service/docs

# 개발 계획서 확인
cat AUTH-DEV-PLAN.md | head -50

# 또는 VS Code로 열기
code AUTH-DEV-PLAN.md
```

---

## 📚 핵심 설계 결정사항

### 1. 완전한 독립성

**결정**: auth-service는 다른 서비스와 완전히 분리
**이유**:
- 다른 프로젝트에서 서브모듈로 추가만 하면 즉시 사용 가능
- 의존성 없이 독립적으로 개발/배포 가능
- 재사용성 극대화

### 2. 모듈화된 구조

**결정**: Backend, Frontend, Database 완전 분리
**이유**:
- 각 모듈을 독립적으로 개발/배포 가능
- 기술 스택 변경 용이
- 팀 협업 시 역할 분담 명확

### 3. TypeScript 우선

**결정**: Backend, Frontend 모두 TypeScript 사용
**이유**:
- 타입 안정성
- IDE 자동완성 지원
- 유지보수성 향상
- 대규모 프로젝트에 적합

### 4. 문서 중심 개발

**결정**: 모든 Phase마다 상세 문서 작성
**이유**:
- 향후 재사용 시 빠른 이해
- 의사결정 과정 기록
- 온보딩 시간 단축
- 유지보수 용이

---

## 🎯 Phase 1 완료 기준

### 체크리스트

- [x] GitHub 저장소 생성
- [x] homegroup에 서브모듈 추가
- [x] 폴더 구조 생성
- [x] AUTH-DEV-PLAN.md 작성 (1,225줄)
- [x] README.md 작성
- [x] database/schema.sql 작성
- [x] .gitignore 작성
- [x] .env.example 파일들 작성
- [x] dev 브랜치 생성
- [x] 첫 커밋 및 push

### 검증

```bash
# 1. 폴더 구조 확인
tree -L 3 auth-service/

# 2. Git 상태 확인
cd auth-service
git status
git log --oneline

# 3. 서브모듈 확인
cd ..
git submodule status

# 4. 문서 확인
wc -l auth-service/docs/AUTH-DEV-PLAN.md
# 출력: 1225 lines
```

---

## 📝 다음 단계 (Phase 2)

### Phase 2에서 할 일:
1. **독립적인 PostgreSQL 컨테이너 생성**
   - docker-compose.yml 작성
   - auth-db 서비스 정의
   - 자동 스키마 초기화

2. **환경변수 설정**
   - .env 파일 생성
   - 데이터베이스 비밀번호 설정

3. **데이터베이스 검증**
   - 컨테이너 시작
   - 테이블 생성 확인
   - 연결 테스트

---

## 🔗 관련 문서

- [AUTH-DEV-PLAN.md](./AUTH-DEV-PLAN.md) - 전체 개발 계획 (1,225줄)
- [../README.md](../README.md) - 프로젝트 소개
- [../database/schema.sql](../database/schema.sql) - DB 스키마
- [../.gitignore](../.gitignore) - Git 제외 파일 목록

---

## 🚨 트러블슈팅

### 문제 1: 서브모듈 추가 실패

```
fatal: You are on a branch yet to be born
```

**해결**:
```bash
# auth-service에서 첫 커밋 생성
cd auth-service
git add .
git commit -m "Initial commit"
git push -u origin main

# homegroup에서 서브모듈 다시 추가
cd ..
git submodule add --force https://github.com/zerone6/auth-service.git
```

### 문제 2: .gitkeep 파일이 추가되지 않음

```bash
# 수동으로 .gitkeep 추가
find . -type d -empty -exec touch {}/.gitkeep \;
git add .
```

### 문제 3: 브랜치 전환 문제

```bash
# main에서 dev 브랜치 생성
git checkout -b dev
git push -u origin dev

# .gitmodules 업데이트
# branch = dev 추가
```

---

## 📊 Phase 1 vs Phase 2 비교

| 항목 | Phase 1 | Phase 2 |
|------|---------|---------|
| **목적** | 프로젝트 기반 구축 | 데이터베이스 설정 |
| **생성 파일** | 문서, 폴더 구조 | docker-compose.yml, .env |
| **코드** | 없음 | 없음 (설정만) |
| **실행** | 불가 | 가능 (DB만) |
| **다음 단계** | Phase 2 | Phase 3 (Backend 개발) |

---

## ✅ Phase 1 완료 요약

### 생성된 것들
- 📁 **15개 파일** (문서, 설정, 스키마)
- 📂 **12개 폴더** (Backend, Frontend, Database, Docs)
- 📄 **1,225줄** 개발 계획서
- 🗂️ **Git 저장소** 및 서브모듈 설정

### 커밋 정보
- **Commit**: `0e2d2a1`
- **Branch**: dev
- **Message**: "feat: Phase 1 - Initial auth-service setup"

### 다음 단계
➡️ **Phase 2**: PostgreSQL 데이터베이스 설정

---

**Phase 1 Status**: ✅ Complete
**Last Updated**: 2025-11-22
**Lines of Documentation**: 1,225
**Git Branches**: main, dev
