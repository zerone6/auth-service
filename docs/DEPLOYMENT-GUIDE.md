# Auth Service 배포 가이드

## 📋 개요

이 가이드는 auth-service를 homegroup 전체에 통합하여 배포하는 방법을 설명합니다.

---

## ✅ 사전 준비

### 1. Google OAuth 설정

**Google Cloud Console**: https://console.cloud.google.com/

1. **프로젝트 생성** (또는 기존 프로젝트 사용)
2. **OAuth 동의 화면 구성**
   - User Type: 외부
   - 앱 이름: Auth Service
   - 승인된 도메인: `hstarsp.net`

3. **OAuth 2.0 클라이언트 ID 생성**
   - 유형: 웹 애플리케이션
   - 승인된 JavaScript 원본:
     - `https://hstarsp.net`
   - 승인된 리디렉션 URI:
     - `https://hstarsp.net/auth/google/callback`

4. **클라이언트 ID와 Secret 복사**

### 2. 환경변수 설정

```bash
cd /Users/seonpillhwang/GitHub/homegroup

# .env 파일 생성
cp .env.example .env
```

**.env 파일 작성:**

```env
# Auth Database Password
AUTH_DB_PASSWORD=$(openssl rand -base64 32)

# Google OAuth (Console에서 복사)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64)

# Session Secret
SESSION_SECRET=$(openssl rand -base64 32)

# Initial Admin
INITIAL_ADMIN_EMAIL=zerone6@gmail.com

# Real Estate DB (기존 설정 유지)
SPRING_PROFILES_ACTIVE=dev
REALESTATE_DB_URL=jdbc:postgresql://host.docker.internal:5432/realestate
REALESTATE_DB_USERNAME=postgres
REALESTATE_DB_PASSWORD=postgres
```

**Secrets 생성 명령어:**
```bash
echo "AUTH_DB_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 64)"
echo "SESSION_SECRET=$(openssl rand -base64 32)"
```

---

## 🚀 로컬 개발 환경 테스트

### 1. Backend & Frontend 개발 서버 실행

**Terminal 1: Backend**
```bash
cd /Users/seonpillhwang/GitHub/homegroup/auth-service/backend
npm run dev
```

**Terminal 2: Frontend**
```bash
cd /Users/seonpillhwang/GitHub/homegroup/auth-service/frontend
npm run dev
```

### 2. 테스트

1. Frontend: http://localhost:5173/login
2. Backend Health: http://localhost:3000/health
3. Database: `docker exec auth-db psql -U auth_user -d auth -c "\dt"`

### 3. OAuth 테스트

1. http://localhost:5173/login 접속
2. "Continue with Google" 클릭
3. Google 로그인
4. 초기 관리자 이메일로 로그인 시 → `/success`
5. 다른 이메일로 로그인 시 → `/pending`

---

## 🐳 Docker Compose 배포

### 1. 전체 빌드

```bash
cd /Users/seonpillhwang/GitHub/homegroup

# 모든 서비스 빌드
docker compose -f docker-compose.local.yml build

# 또는 특정 서비스만
docker compose -f docker-compose.local.yml build auth-service
docker compose -f docker-compose.local.yml build auth-db
```

### 2. 서비스 시작

```bash
# 전체 서비스 시작
docker compose -f docker-compose.local.yml up -d

# 특정 서비스만
docker compose -f docker-compose.local.yml up -d auth-service auth-db nginx-proxy
```

### 3. 로그 확인

```bash
# 전체 로그
docker compose -f docker-compose.local.yml logs -f

# Auth Service만
docker compose -f docker-compose.local.yml logs -f auth-service

# Auth DB만
docker compose -f docker-compose.local.yml logs -f auth-db
```

### 4. 서비스 상태 확인

```bash
# 컨테이너 목록
docker compose -f docker-compose.local.yml ps

# Auth Service 헬스 체크
curl https://hstarsp.net/health
curl https://hstarsp.net/auth/status
```

---

## 🧪 통합 테스트 시나리오

### 시나리오 1: 비로그인 사용자

1. **메인 페이지 접속**
   ```
   https://hstarsp.net/
   ```
   **예상:** 로그인 카드 표시 (🔐 로그인이 필요합니다)

2. **서비스 접속 시도**
   ```
   https://hstarsp.net/realestate/
   ```
   **예상:** `/auth/login`으로 리다이렉트

### 시나리오 2: 초기 관리자 로그인

1. **메인 페이지에서 로그인 버튼 클릭**
   ```
   https://hstarsp.net/ → 로그인 버튼
   ```

2. **Auth Service 로그인 페이지**
   ```
   https://hstarsp.net/auth/login
   ```
   "Continue with Google" 클릭

3. **Google OAuth**
   - Google 로그인 화면
   - `INITIAL_ADMIN_EMAIL`과 동일한 계정으로 로그인

4. **Success 페이지**
   ```
   https://hstarsp.net/success
   ```
   **예상:**
   - ✅ Welcome!
   - zerone6@gmail.com
   - 👑 Admin 배지
   - [Go to Admin Dashboard] 버튼

5. **메인 페이지로 돌아가기**
   ```
   https://hstarsp.net/
   ```
   **예상:**
   - 사용자 이메일 표시
   - [로그아웃] 버튼
   - 입시일정, 부동산 카드 표시

6. **서비스 접속**
   ```
   https://hstarsp.net/realestate/
   ```
   **예상:** 정상 접근

### 시나리오 3: 일반 사용자 가입 및 승인

1. **시크릿 창에서 다른 Gmail로 로그인**
   ```
   https://hstarsp.net/auth/login
   ```

2. **Pending 페이지**
   ```
   https://hstarsp.net/pending
   ```
   **예상:**
   - ⏳ Approval Pending
   - 승인 대기 안내

3. **관리자 승인 (첫 번째 창)**
   ```
   https://hstarsp.net/admin
   ```
   **단계:**
   - Pending 탭 확인
   - 대기 중인 사용자 표시
   - ✓ 버튼 클릭
   - 통계 업데이트 확인

4. **일반 사용자 재로그인 (두 번째 창)**
   - Sign Out 클릭
   - 다시 로그인
   - `/success` 페이지로 이동
   - 서비스 정상 접근

### 시나리오 4: API 인증 테스트

```bash
# 비로그인 상태
curl https://hstarsp.net/api/some-endpoint

# 예상: 401 Unauthorized
# {"error": "Unauthorized", "message": "Authentication required"}

# 로그인 후 (쿠키 포함)
curl https://hstarsp.net/api/some-endpoint \
  -H "Cookie: auth_token=<YOUR_TOKEN>"

# 예상: 정상 응답 (backend에서 X-Auth-User-Id 헤더 받음)
```

---

## 🔍 데이터베이스 확인

### Auth DB 접속

```bash
# 컨테이너 접속
docker exec -it auth-db psql -U auth_user -d auth

# 또는 직접 쿼리
docker exec auth-db psql -U auth_user -d auth -c "SELECT id, email, role, status FROM users;"
```

### 사용자 목록 조회

```sql
SELECT
    id,
    email,
    role,
    status,
    created_at,
    approved_at
FROM users
ORDER BY created_at DESC;
```

### 감사 로그 조회

```sql
SELECT
    al.id,
    u1.email AS admin_email,
    al.action,
    u2.email AS target_email,
    al.created_at
FROM audit_log al
LEFT JOIN users u1 ON al.admin_id = u1.id
LEFT JOIN users u2 ON al.target_user_id = u2.id
ORDER BY al.created_at DESC
LIMIT 10;
```

---

## 🚨 트러블슈팅

### 1. Auth Service가 시작되지 않음

**증상:**
```bash
docker logs auth-service
# Error: Cannot connect to database
```

**해결:**
```bash
# Auth DB 상태 확인
docker ps | grep auth-db

# Auth DB가 없으면 시작
docker compose -f docker-compose.local.yml up -d auth-db

# Auth Service 재시작
docker compose -f docker-compose.local.yml restart auth-service
```

### 2. Google OAuth 리다이렉트 오류

**증상:** `redirect_uri_mismatch` 에러

**해결:**
1. Google Cloud Console → OAuth 2.0 클라이언트 ID
2. 승인된 리디렉션 URI 확인:
   ```
   https://hstarsp.net/auth/google/callback
   ```
3. `.env`의 `GOOGLE_CALLBACK_URL` 확인
4. Auth Service 재시작

### 3. 메인 페이지에서 항상 로그인 카드 표시

**증상:** 로그인 후에도 서비스 카드가 안 보임

**원인:** `/auth/status` 엔드포인트 접근 실패

**해결:**
```bash
# Nginx 로그 확인
docker logs nginx-proxy

# Auth Service 로그 확인
docker logs auth-service

# 직접 테스트
curl https://hstarsp.net/auth/status \
  -H "Cookie: auth_token=<YOUR_TOKEN>"
```

### 4. 쿠키가 설정되지 않음

**증상:** 로그인 후 쿠키 없음

**원인:**
- Secure flag 설정 (HTTP에서 HTTPS 쿠키 안 받음)
- SameSite 설정

**해결:**
```bash
# Backend 환경변수 확인
docker exec auth-service env | grep NODE_ENV

# production이면 HTTPS 필수
# development면 HTTP에서도 동작
```

### 5. Nginx auth_request 404

**증상:** `/auth/verify` 404 Not Found

**해결:**
```bash
# Nginx 설정 확인
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 10 "location = /auth/verify"

# Auth Service upstream 확인
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep "upstream auth-service"

# Nginx 재시작
docker compose -f docker-compose.local.yml restart nginx-proxy
```

---

## 📊 서비스 구성도

```
                    ┌─────────────────┐
                    │   hstarsp.net   │
                    │   (Nginx:443)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌────▼─────┐       ┌─────▼─────┐
   │  main-  │         │  auth-   │       │realestate-│
   │  page   │         │ service  │       │  frontend │
   │  :80    │         │  :3000   │       │   :80     │
   └─────────┘         └────┬─────┘       └───────────┘
                            │
                       ┌────▼────┐
                       │ auth-db │
                       │ :5432   │
                       └─────────┘
```

**인증 흐름:**
```
User Request → Nginx
  ├─ / → main-page (인증 불필요, JS로 체크)
  ├─ /auth/* → auth-service (인증 불필요)
  ├─ /admin/* → auth-service (자체 미들웨어)
  └─ /realestate/* → auth_request /auth/verify
                     ├─ 200 OK → realestate-frontend
                     └─ 401/403 → redirect /auth/login
```

---

## 📝 체크리스트

### 배포 전

- [ ] Google OAuth 클라이언트 ID/Secret 발급
- [ ] `.env` 파일 생성 및 모든 환경변수 설정
- [ ] `INITIAL_ADMIN_EMAIL` 올바른 이메일 설정
- [ ] SSL 인증서 준비 (`nginx/ssl/` 폴더)

### 배포 중

- [ ] `docker compose build` 성공
- [ ] `docker compose up -d` 성공
- [ ] 모든 컨테이너 실행 중 (`docker ps`)
- [ ] Auth DB 테이블 생성 확인
- [ ] Auth Service 헬스 체크 성공

### 배포 후

- [ ] 메인 페이지 접속 (로그인 카드 표시)
- [ ] 로그인 플로우 테스트
- [ ] 초기 관리자 자동 승인 확인
- [ ] 일반 사용자 가입 → Pending 확인
- [ ] 관리자 승인 기능 테스트
- [ ] 서비스 접근 제어 확인 (/realestate/, /highschool/)
- [ ] API 인증 확인 (/api/)

---

## 🎯 완료!

모든 체크리스트를 완료하면 auth-service가 homegroup 전체를 보호하는 상태가 됩니다.

**접속 URL:**
- 메인: https://hstarsp.net/
- 로그인: https://hstarsp.net/auth/login
- 관리자: https://hstarsp.net/admin

**문의사항이 있으면 문서를 참조하세요:**
- [PHASE3-OAUTH-IMPLEMENTATION.md](./PHASE3-OAUTH-IMPLEMENTATION.md)
- [PHASE4-FRONTEND.md](./PHASE4-FRONTEND.md)
- [PHASE5-NGINX-INTEGRATION.md](./PHASE5-NGINX-INTEGRATION.md)

---

## ⚠️ 중요 배포 주의사항

### 1. 순차 빌드 필수

Oracle Cloud ARM 서버의 메모리 제약으로 인해 **반드시 서비스를 순차적으로 빌드**해야 합니다.

**GitHub Actions 배포 순서:**
```bash
# 순차 빌드 순서 (동시 빌드 금지!)
1. main-page           # 가벼움
2. auth-backend        # Node.js
3. auth-frontend       # React
4. realestate-backend  # Java/Maven - 메모리 많이 사용
5. realestate-frontend # React - 메모리 많이 사용
6. highschool          # React
7. nginx               # 설정만
```

**잘못된 예시 (동시 빌드):**
```bash
# ❌ 이렇게 하면 메모리 부족으로 빌드 프리징!
docker compose -f docker-compose.local.yml up -d --build
```

**올바른 예시 (순차 빌드):**
```bash
# ✅ 하나씩 순차적으로
docker compose -f docker-compose.local.yml up -d --build main-page
docker compose -f docker-compose.local.yml up -d --build auth-backend
docker compose -f docker-compose.local.yml up -d --build auth-frontend
# ... 이하 동일
```

### 2. 실서버 배포 전 개발환경 테스트 필수

실서버에서 빌드 실패나 문제가 발생하면 시간이 많이 소요되므로, **반드시 로컬에서 프로덕션 빌드를 테스트**해야 합니다.

#### 로컬 프로덕션 빌드 테스트 방법

**방법 1: Vite Preview (Frontend만)**
```bash
# 프로젝트 디렉토리에서
npm run build
npm run preview

# 예: auth-frontend
cd /Users/seonpillhwang/GitHub/homegroup/auth-service/frontend
npm run build
npm run preview
# http://localhost:4173 에서 확인
```

**방법 2: Docker 로컬 빌드**
```bash
# 개별 서비스 Docker 빌드 테스트
cd /Users/seonpillhwang/GitHub/homegroup/auth-service/frontend
docker build -t test-auth-frontend .

# 실행 테스트
docker run -p 8080:80 test-auth-frontend
# http://localhost:8080 에서 확인
```

**방법 3: Docker Compose 로컬 테스트 (권장)**
```bash
# homegroup 전체 빌드 및 실행
cd /Users/seonpillhwang/GitHub/homegroup

# 순차 빌드
docker compose -f docker-compose.local.yml build main-page
docker compose -f docker-compose.local.yml build auth-backend
docker compose -f docker-compose.local.yml build auth-frontend
docker compose -f docker-compose.local.yml build realestate-backend
docker compose -f docker-compose.local.yml build realestate-frontend
docker compose -f docker-compose.local.yml build highschool

# 전체 실행
docker compose -f docker-compose.local.yml up -d

# 로그 확인
docker compose -f docker-compose.local.yml logs -f
```

**빌드 실패 시 체크리스트:**
- [ ] Vite base path 설정 확인 (`vite.config.ts`)
- [ ] Nginx 설정 확인 (Dockerfile의 nginx 설정)
- [ ] React Router basename 설정 확인
- [ ] 환경변수 설정 확인 (`.env`)
- [ ] 포트 충돌 확인
- [ ] 빌드 산출물 경로 확인 (`dist/` 폴더)

**배포 전 필수 확인 사항:**
```bash
# 1. 로컬에서 빌드 성공 확인
npm run build  # 또는 docker build

# 2. 빌드 결과물 확인
ls -la dist/   # 빌드 파일 존재 확인

# 3. 로컬에서 실행 테스트
npm run preview  # 또는 docker run

# 4. 브라우저에서 동작 확인
# - 페이지 로딩
# - 라우팅 (새로고침 포함)
# - Static asset 로딩 (JS, CSS, 이미지)
# - API 호출

# 5. 콘솔 에러 확인
# - 404 에러 없는지
# - MIME type 에러 없는지
# - CORS 에러 없는지
```

### 배포 워크플로우 요약

```
1. 로컬 개발 완료
   ↓
2. dev 브랜치에 커밋
   ↓
3. 로컬에서 프로덕션 빌드 테스트 ✅ 필수!
   ↓
4. 빌드 성공 확인 후 main 브랜치 머지
   ↓
5. main → master 머지
   ↓
6. GitHub Actions 자동 배포 (순차 빌드)
   ↓
7. 실서버 확인
```

**시간 절약 팁:**
- 로컬 테스트를 생략하면 실서버에서 문제 발생 시 수정 → 푸시 → 대기 → 실패 → 반복으로 시간 낭비
- 로컬에서 5분 테스트하면 실서버에서 30분 디버깅 시간 절약!
