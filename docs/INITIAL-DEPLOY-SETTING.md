# 초기 배포 설정 가이드

## 📋 개요

이 문서는 auth-service를 처음 배포할 때 **반복적인 빌드를 최소화**하면서 안전하게 설정하는 방법을 설명합니다.

### 왜 이 방법을 사용하는가?

**문제:**
- 배포/테스트 반복 시 GitHub Actions로 전체 빌드
- my-realestate-calc 같은 무거운 서비스도 매번 재빌드
- 시간 낭비 + 불필요한 리소스 사용

**해결:**
- auth-service만 먼저 **서버에서 직접** 배포/테스트
- 안정화 확인 후 GitHub Actions 설정
- 이후 변경사항만 자동 배포

---

## 🚀 전체 작업 흐름

```
Phase 1: 수동 배포 준비
   ↓
Phase 2: auth-service 단독 테스트
   ↓
Phase 3: Nginx 통합 테스트
   ↓
Phase 4: 전체 서비스 통합
   ↓
Phase 5: GitHub Actions 설정
   ↓
Phase 6: 자동 배포 (선택)
```

---

## Phase 1: 기존 서비스 중단 및 auth-service 수동 배포

### 1-1. 서버 접속 및 현재 서비스 중단

```bash
# 서버 SSH 접속
ssh your_server_user@your_server_ip

# homegroup 디렉토리로 이동
cd /path/to/homegroup
# 예: cd ~/homegroup 또는 cd /var/www/homegroup

# 현재 실행 중인 서비스 확인
docker compose -f docker-compose.local.yml ps

# 전체 서비스 중단
docker compose -f docker-compose.local.yml down

# ⚠️ 주의: 볼륨은 유지됨 (데이터 보존)
# - realestate-pg-data (기존 DB 데이터)
# - auth-db-data (새로 생성될 Auth DB 데이터)
```

### 1-2. auth-service 코드 가져오기

```bash
# 방법 1: Git submodule 업데이트
git submodule update --init --remote auth-service

# 방법 2: auth-service 디렉토리에서 직접 pull
cd auth-service
git checkout dev
git pull origin dev
cd ..

# 코드 확인
ls -la auth-service/
ls -la auth-service/backend/
ls -la auth-service/database/
```

### 1-3. .env 파일 설정

```bash
# homegroup 루트에서
cd /path/to/homegroup

# .env 파일이 없으면 생성
if [ ! -f .env ]; then
    cp .env.example .env
fi

# .env 편집
nano .env
# 또는 vim .env
```

#### .env 설정 내용 (Production 값)

```env
# ==========================================
# Auth Service Configuration
# ==========================================

# Auth Database Password
# 생성: openssl rand -base64 32
AUTH_DB_PASSWORD=<실제_강력한_비밀번호_여기에>

# Google OAuth (Production)
# Google Cloud Console에서 발급받은 값
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>

# JWT Secret
# 생성: openssl rand -base64 64
JWT_SECRET=<생성한_JWT_Secret>

# Session Secret
# 생성: openssl rand -base64 32
SESSION_SECRET=<생성한_Session_Secret>

# Initial Admin (Google 로그인 이메일)
INITIAL_ADMIN_EMAIL=zerone6@gmail.com

# ==========================================
# Real Estate Calculator (기존 설정 유지)
# ==========================================
SPRING_PROFILES_ACTIVE=prod
REALESTATE_DB_URL=jdbc:postgresql://host.docker.internal:5432/realestate
REALESTATE_DB_USERNAME=postgres
REALESTATE_DB_PASSWORD=<기존_DB_비밀번호>
```

#### 비밀번호 생성 방법

```bash
# Auth DB Password
echo "AUTH_DB_PASSWORD=$(openssl rand -base64 32)"

# JWT Secret
echo "JWT_SECRET=$(openssl rand -base64 64)"

# Session Secret
echo "SESSION_SECRET=$(openssl rand -base64 32)"
```

생성된 값을 복사해서 `.env` 파일에 붙여넣기

### 1-4. Google OAuth 설정 확인

**Google Cloud Console**: https://console.cloud.google.com/

1. **OAuth 2.0 클라이언트 ID 확인**
   - 승인된 JavaScript 원본:
     ```
     https://hstarsp.net
     ```
   - 승인된 리디렉션 URI:
     ```
     https://hstarsp.net/auth/google/callback
     ```

2. **클라이언트 ID와 Secret 복사**
   - `.env` 파일의 `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET`에 입력

---

## Phase 2: auth-service 단독 테스트

### 2-1. auth-db 시작 및 확인

```bash
# auth-db만 먼저 시작
docker compose -f docker-compose.local.yml up -d auth-db

# 로그 확인 (초기화 완료까지 대기)
docker compose -f docker-compose.local.yml logs -f auth-db

# 예상 출력:
# PostgreSQL init process complete; ready for start up.
# database system is ready to accept connections
```

**Ctrl+C로 로그 모니터링 종료**

### 2-2. 데이터베이스 테이블 확인

```bash
# 테이블 생성 확인
docker exec auth-db psql -U auth_user -d auth -c "\dt"

# 예상 출력:
#             List of relations
#  Schema |    Name    | Type  |    Owner
# --------+------------+-------+-------------
#  public | audit_log  | table | auth_user
#  public | sessions   | table | auth_user
#  public | users      | table | auth_user
# (3 rows)

# 테이블 구조 확인 (선택)
docker exec auth-db psql -U auth_user -d auth -c "\d users"
```

### 2-3. auth-service 빌드 및 시작

```bash
# auth-service 빌드 (첫 실행 시)
docker compose -f docker-compose.local.yml build auth-service

# 빌드 시간: 약 2-3분 (Node.js 의존성 설치 + TypeScript 빌드)

# auth-service 시작
docker compose -f docker-compose.local.yml up -d auth-service

# 로그 확인
docker compose -f docker-compose.local.yml logs -f auth-service
```

**예상 출력:**
```
✅ Database connected successfully
✅ Database connection test passed: 2025-11-22...

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔐 Auth Service Backend                                ║
║                                                           ║
║   Environment: production                              ║
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

### 2-4. 헬스 체크

```bash
# 컨테이너 내부에서 헬스 체크
docker exec auth-service wget -qO- http://localhost:3000/health

# 예상 출력:
# {"status":"ok","service":"auth-service","timestamp":"2025-11-22T..."}

# DB 헬스 체크
docker exec auth-service wget -qO- http://localhost:3000/db/health

# 예상 출력:
# {"database":"connected","timestamp":"2025-11-22T..."}
```

### 2-5. 임시 포트 노출로 OAuth 테스트 (선택)

**OAuth를 Nginx 없이 미리 테스트하고 싶다면:**

#### docker-compose.local.yml 임시 수정

```bash
nano docker-compose.local.yml
```

`auth-service` 섹션에 `ports` 추가:
```yaml
auth-service:
  build:
    context: ./auth-service/backend
    dockerfile: Dockerfile
  container_name: auth-service
  ports:                    # ← 이 섹션 추가 (임시)
    - "3000:3000"           # ← 임시!
  expose:
    - "3000"
  environment:
    # ... (나머지 동일)
```

#### auth-service 재시작

```bash
docker compose -f docker-compose.local.yml restart auth-service
```

#### 브라우저에서 테스트

```
# Health check
http://your_server_ip:3000/health

# Google OAuth 시작
http://your_server_ip:3000/auth/google
```

- Google 로그인 화면으로 리다이렉트 확인
- 로그인 시도 (콜백은 실패할 수 있음 - Nginx 없으므로)

#### 테스트 완료 후 포트 제거

```bash
# docker-compose.local.yml에서 ports 섹션 제거
nano docker-compose.local.yml

# 재시작
docker compose -f docker-compose.local.yml restart auth-service
```

---

## Phase 3: Nginx 통합 테스트

### 3-1. nginx-proxy 시작

```bash
# nginx-proxy 시작
docker compose -f docker-compose.local.yml up -d nginx-proxy

# 로그 확인
docker compose -f docker-compose.local.yml logs -f nginx-proxy

# Nginx 시작 성공 확인
# 예상: "start worker process"
```

**Ctrl+C로 로그 종료**

### 3-2. Nginx 설정 확인

```bash
# Nginx 설정 파일 확인
docker exec nginx-proxy nginx -t

# 예상 출력:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# auth-service upstream 확인
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 3 "upstream auth-service"

# 예상 출력:
# upstream auth-service {
#     server auth-service:3000;
# }
```

### 3-3. 실제 도메인으로 헬스 체크

```bash
# 서버 로컬에서 테스트
curl -k https://localhost/health

# 예상 출력: healthy

# Auth 상태 확인
curl -k https://localhost/auth/status

# 예상 출력: {"authenticated":false} (아직 로그인 안 함)
```

### 3-4. 외부에서 접속 테스트

**로컬 컴퓨터에서:**

```bash
# Health check
curl https://hstarsp.net/health

# Auth status
curl https://hstarsp.net/auth/status
```

### 3-5. 브라우저에서 OAuth 전체 플로우 테스트

#### 초기 관리자 로그인

1. **메인 페이지 접속**
   ```
   https://hstarsp.net/
   ```
   **예상:** 로그인 카드 표시 (🔐 로그인이 필요합니다)

2. **로그인 버튼 클릭**
   - Google OAuth 페이지로 리다이렉트
   - `INITIAL_ADMIN_EMAIL`과 동일한 계정으로 로그인

3. **콜백 확인**
   ```
   https://hstarsp.net/auth/google/callback
   ```
   - 자동으로 처리됨
   - `/success` 페이지로 리다이렉트

4. **Success 페이지 확인**
   ```
   https://hstarsp.net/success
   ```
   **예상:**
   - ✅ Welcome!
   - zerone6@gmail.com 표시
   - 👑 Admin 배지
   - [Go to Admin Dashboard] 버튼

5. **메인 페이지 재확인**
   ```
   https://hstarsp.net/
   ```
   **예상:**
   - 로그인 카드 → 서비스 카드로 변경
   - zerone6@gmail.com 표시
   - [로그아웃] 버튼
   - 입시일정, 부동산 카드 표시

### 3-6. Admin API 테스트

```bash
# 브라우저 개발자 도구 (F12)
# Application → Cookies → https://hstarsp.net
# auth_token 쿠키 값 복사

# Admin 통계 조회
curl https://hstarsp.net/admin/stats \
  -H "Cookie: auth_token=<복사한_토큰>"

# 예상 출력:
# {
#   "success": true,
#   "stats": {
#     "total": 1,
#     "pending": 0,
#     "approved": 1,
#     "rejected": 0
#   }
# }
```

### 3-7. 일반 사용자 가입 테스트 (선택)

**시크릿 창(Incognito)에서:**

1. `https://hstarsp.net/` 접속
2. 로그인 → 다른 Gmail 계정 사용
3. → `/pending` 페이지로 리다이렉트
4. **예상:** ⏳ Approval Pending 메시지

**관리자 창에서 승인:**

```
https://hstarsp.net/admin
```
- Pending 탭 확인
- 대기 중인 사용자 표시
- ✓ 버튼 클릭하여 승인

**일반 사용자 재로그인:**
- Sign Out → 다시 로그인
- → `/success` 페이지로 이동

---

## Phase 4: 전체 서비스 통합

### 4-1. main-page 시작

```bash
# main-page 빌드 및 시작
docker compose -f docker-compose.local.yml up -d main-page

# 로그 확인
docker compose -f docker-compose.local.yml logs -f main-page
```

#### 테스트

```bash
# 서버에서
curl -k https://localhost/

# 브라우저에서
https://hstarsp.net/
```

**예상:**
- 로그인 전: 로그인 카드
- 로그인 후: 서비스 카드 + 사용자 이메일

### 4-2. realestate 서비스 추가

```bash
# 이미 빌드된 이미지가 있으면 재사용됨 (빠름!)
docker compose -f docker-compose.local.yml up -d realestate-frontend realestate-backend

# 로그 확인
docker compose -f docker-compose.local.yml logs -f realestate-frontend
docker compose -f docker-compose.local.yml logs -f realestate-backend
```

**빌드 시간:**
- 첫 빌드: 약 5-10분
- 이미 빌드됨: 5-10초 (캐시 활용)

### 4-3. highschool 서비스 추가 (있다면)

```bash
docker compose -f docker-compose.local.yml up -d highschool

# 로그 확인
docker compose -f docker-compose.local.yml logs -f highschool
```

### 4-4. 전체 서비스 상태 확인

```bash
# 모든 컨테이너 확인
docker compose -f docker-compose.local.yml ps

# 예상 출력:
# NAME                  STATUS        PORTS
# nginx-proxy           Up            0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
# auth-service          Up            3000/tcp
# auth-db               Up            5432/tcp
# main-page             Up            80/tcp
# realestate-frontend   Up            80/tcp
# realestate-backend    Up            8080/tcp
# highschool            Up            80/tcp
```

### 4-5. 인증 통합 테스트

#### 비로그인 상태에서 서비스 접근

```bash
# 쿠키 없이 realestate 접근
curl -I https://hstarsp.net/realestate/

# 예상 출력:
# HTTP/2 302
# location: https://hstarsp.net/auth/login
```

**브라우저 (시크릿 창):**

1. `https://hstarsp.net/realestate/` 직접 접속
2. → `/auth/login`으로 리다이렉트
3. 로그인
4. → `/realestate/` 정상 접근

#### 로그인 상태에서 서비스 접근

**브라우저 (로그인된 창):**

1. `https://hstarsp.net/` 접속
2. "부동산 계산기" 카드 클릭
3. → `/realestate/` 정상 접근 (리다이렉트 없음)

### 4-6. API 인증 테스트

```bash
# 비로그인 상태
curl https://hstarsp.net/api/some-endpoint

# 예상 출력:
# {"error": "Unauthorized", "message": "Authentication required"}

# 로그인 상태 (쿠키 포함)
curl https://hstarsp.net/api/some-endpoint \
  -H "Cookie: auth_token=<YOUR_TOKEN>"

# 예상: 정상 응답 또는 404 (엔드포인트에 따라)
```

---

## Phase 5: GitHub Actions 설정

### 5-1. auth-service에 GitHub Actions Workflow 생성

```bash
# 로컬 컴퓨터에서
cd /Users/seonpillhwang/GitHub/homegroup/auth-service

# GitHub Actions 디렉토리 생성
mkdir -p .github/workflows
```

#### Workflow 파일 생성

**파일:** `.github/workflows/deploy-backend.yml`

```yaml
name: Deploy Auth Service Backend

on:
  push:
    branches:
      - dev
    paths:
      - 'backend/**'
      - 'database/**'
      - '.github/workflows/deploy-backend.yml'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: zerone6/auth-service-backend

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64
```

### 5-2. GitHub에 Push 및 Actions 확인

```bash
# auth-service 저장소에서
cd /Users/seonpillhwang/GitHub/homegroup/auth-service

git add .github/workflows/deploy-backend.yml
git commit -m "feat: add GitHub Actions workflow for backend deployment"
git push origin dev
```

**GitHub 확인:**
1. https://github.com/zerone6/auth-service/actions
2. "Deploy Auth Service Backend" Workflow 실행 확인
3. 빌드 성공 확인 (약 5-10분)

### 5-3. GHCR 이미지 확인

```bash
# 로컬에서 GHCR 로그인 (테스트용)
echo $GITHUB_TOKEN | docker login ghcr.io -u zerone6 --password-stdin

# 이미지 pull 테스트
docker pull ghcr.io/zerone6/auth-service-backend:dev
```

### 5-4. docker-compose.local.yml 수정 (Image 사용)

**homegroup/docker-compose.local.yml 수정:**

```yaml
# Auth Service - Backend
auth-service:
  # build: 대신 image 사용
  image: ghcr.io/zerone6/auth-service-backend:dev
  container_name: auth-service
  expose:
    - "3000"
  environment:
    - NODE_ENV=production
    - PORT=3000
    - DATABASE_URL=postgresql://auth_user:${AUTH_DB_PASSWORD}@auth-db:5432/auth
    - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
    - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    - GOOGLE_CALLBACK_URL=https://hstarsp.net/auth/google/callback
    - JWT_SECRET=${JWT_SECRET}
    - JWT_EXPIRES_IN=7d
    - SESSION_SECRET=${SESSION_SECRET}
    - INITIAL_ADMIN_EMAIL=${INITIAL_ADMIN_EMAIL}
    - FRONTEND_URL=https://hstarsp.net
    - ALLOWED_ORIGINS=https://hstarsp.net,https://www.hstarsp.net
  networks:
    - web
  depends_on:
    - auth-db
  restart: unless-stopped
```

**변경사항 커밋:**

```bash
# homegroup 저장소에서
cd /Users/seonpillhwang/GitHub/homegroup

git add docker-compose.local.yml
git commit -m "chore: use GHCR image for auth-service"
git push origin dev
```

### 5-5. 서버에서 GHCR 이미지 사용

```bash
# 서버 SSH 접속
ssh your_server

cd /path/to/homegroup

# homegroup 저장소 업데이트
git pull origin dev

# GHCR 로그인
echo $GITHUB_TOKEN | docker login ghcr.io -u zerone6 --password-stdin

# auth-service 이미지 pull
docker compose -f docker-compose.local.yml pull auth-service

# auth-service 재시작
docker compose -f docker-compose.local.yml up -d auth-service

# 로그 확인
docker compose -f docker-compose.local.yml logs -f auth-service
```

### 5-6. GitHub Actions 자동 배포 테스트

**로컬에서 코드 수정:**

```bash
cd /Users/seonpillhwang/GitHub/homegroup/auth-service/backend

# 간단한 변경 (예: health 메시지 수정)
nano src/server.ts
# status: 'ok' → status: 'healthy'

git add .
git commit -m "test: update health check message"
git push origin dev
```

**GitHub Actions 확인:**
1. Actions 탭에서 빌드 시작 확인
2. 빌드 완료 (약 5-10분)

**서버에서 업데이트:**

```bash
# 서버에서
docker compose -f docker-compose.local.yml pull auth-service
docker compose -f docker-compose.local.yml up -d auth-service

# 변경사항 확인
curl https://hstarsp.net/health
# {"status":"healthy",...}
```

---

## Phase 6: 자동 배포 설정 (선택 사항)

### 6-1. 서버에 배포 스크립트 생성

**서버에서:**

```bash
# 배포 스크립트 생성
nano ~/deploy-auth-service.sh
```

**스크립트 내용:**

```bash
#!/bin/bash

# Auth Service 자동 배포 스크립트

set -e

echo "🚀 Starting auth-service deployment..."

# homegroup 디렉토리로 이동
cd /path/to/homegroup

# Git pull (docker-compose.yml 업데이트 확인)
echo "📥 Pulling latest changes..."
git pull origin dev

# GHCR 이미지 pull
echo "🐳 Pulling latest Docker image..."
docker compose -f docker-compose.local.yml pull auth-service

# auth-service 재시작
echo "🔄 Restarting auth-service..."
docker compose -f docker-compose.local.yml up -d auth-service

# 헬스 체크
echo "🏥 Health check..."
sleep 5
curl -f https://localhost/health || exit 1

echo "✅ Deployment completed successfully!"
```

**스크립트 실행 권한:**

```bash
chmod +x ~/deploy-auth-service.sh
```

### 6-2. GitHub Actions에 SSH 배포 추가

**auth-service/.github/workflows/deploy-backend.yml 수정:**

```yaml
name: Deploy Auth Service Backend

on:
  push:
    branches:
      - dev
    paths:
      - 'backend/**'
      - 'database/**'
      - '.github/workflows/deploy-backend.yml'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: zerone6/auth-service-backend

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            ~/deploy-auth-service.sh
```

### 6-3. GitHub Secrets 설정

**GitHub 저장소에서:**

1. Settings → Secrets and variables → Actions
2. New repository secret 클릭

**추가할 Secrets:**

- **SERVER_HOST**: 서버 IP 또는 도메인
  ```
  예: 123.456.789.012 또는 hstarsp.net
  ```

- **SERVER_USER**: SSH 사용자명
  ```
  예: ubuntu 또는 your_username
  ```

- **SERVER_SSH_KEY**: SSH 개인키
  ```bash
  # 로컬에서 개인키 확인
  cat ~/.ssh/id_rsa
  # 또는
  cat ~/.ssh/id_ed25519

  # 전체 내용 복사 (-----BEGIN ... -----END 포함)
  ```

### 6-4. 자동 배포 테스트

```bash
# 로컬에서 코드 수정
cd /Users/seonpillhwang/GitHub/homegroup/auth-service

# 간단한 변경
echo "// Test auto deploy" >> backend/src/server.ts

git add .
git commit -m "test: auto deployment"
git push origin dev
```

**GitHub Actions 확인:**
1. Build job 완료
2. Deploy job 실행
3. 서버에 자동 배포

**서버에서 확인:**
```bash
# 로그 확인
docker compose -f docker-compose.local.yml logs auth-service

# 최신 이미지 확인
docker images | grep auth-service
```

---

## 📋 최종 체크리스트

### ✅ Phase 1: 수동 배포 준비
- [ ] 서버 접속
- [ ] 현재 서비스 중단
- [ ] auth-service 코드 pull
- [ ] .env 파일 설정 (모든 비밀번호 생성)
- [ ] Google OAuth 설정 확인

### ✅ Phase 2: auth-service 단독 테스트
- [ ] auth-db 시작 및 테이블 확인
- [ ] auth-service 빌드 및 시작
- [ ] 헬스 체크 성공
- [ ] (선택) 임시 포트로 OAuth 테스트

### ✅ Phase 3: Nginx 통합
- [ ] nginx-proxy 시작
- [ ] Nginx 설정 확인
- [ ] https://hstarsp.net/health 성공
- [ ] Google OAuth 전체 플로우 테스트
- [ ] 초기 관리자 자동 승인 확인
- [ ] Admin API 테스트
- [ ] 일반 사용자 가입/승인 테스트

### ✅ Phase 4: 전체 서비스
- [ ] main-page 시작 및 확인
- [ ] realestate 서비스 시작 (캐시 활용)
- [ ] highschool 서비스 시작 (있다면)
- [ ] 전체 컨테이너 상태 확인
- [ ] 비로그인 → 리다이렉트 테스트
- [ ] 로그인 → 서비스 접근 테스트
- [ ] API 인증 테스트

### ✅ Phase 5: GitHub Actions
- [ ] Workflow 파일 생성
- [ ] GitHub Actions 빌드 성공
- [ ] GHCR 이미지 확인
- [ ] docker-compose.yml을 image로 변경
- [ ] 서버에서 GHCR 이미지 pull 및 재시작
- [ ] 코드 수정 → 자동 빌드 테스트

### ✅ Phase 6: 자동 배포 (선택)
- [ ] 서버 배포 스크립트 생성
- [ ] GitHub Actions에 SSH 배포 추가
- [ ] GitHub Secrets 설정
- [ ] 자동 배포 테스트

---

## 🚨 문제 해결

### auth-service 시작 실패

**증상:**
```bash
docker logs auth-service
# Error: Cannot connect to database
```

**해결:**
```bash
# auth-db 상태 확인
docker ps | grep auth-db

# auth-db 재시작
docker compose -f docker-compose.local.yml restart auth-db

# auth-service 재시작
docker compose -f docker-compose.local.yml restart auth-service
```

### Google OAuth 리다이렉트 오류

**증상:** `redirect_uri_mismatch`

**해결:**
1. Google Cloud Console → OAuth 2.0 클라이언트
2. 리디렉션 URI 확인: `https://hstarsp.net/auth/google/callback`
3. `.env`의 `GOOGLE_CALLBACK_URL` 확인
4. auth-service 재시작

### Nginx 502 Bad Gateway

**증상:** `https://hstarsp.net/` 접속 시 502 에러

**해결:**
```bash
# 모든 컨테이너 확인
docker compose -f docker-compose.local.yml ps

# auth-service 또는 main-page가 없으면 시작
docker compose -f docker-compose.local.yml up -d auth-service main-page

# Nginx 재시작
docker compose -f docker-compose.local.yml restart nginx-proxy
```

### 빌드 캐시 문제

**증상:** 변경사항이 반영 안 됨

**해결:**
```bash
# 캐시 없이 재빌드
docker compose -f docker-compose.local.yml build --no-cache auth-service

# 재시작
docker compose -f docker-compose.local.yml up -d auth-service
```

---

## 🎯 완료!

모든 Phase를 완료하면:
- ✅ auth-service가 안정적으로 실행
- ✅ 전체 homegroup이 인증으로 보호됨
- ✅ GitHub Actions로 자동 빌드
- ✅ (선택) SSH로 자동 배포

**다음 작업:**
- 추가 OAuth 제공자 (Naver, Facebook, LINE)
- 이메일 알림 기능
- 로그 모니터링

---

**문서 작성:** 2025-11-22
**최종 업데이트:** 2025-11-22
