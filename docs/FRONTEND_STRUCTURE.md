# Auth Service Frontend 구조

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.2 | UI 프레임워크 |
| TypeScript | 5.2 | 정적 타입 |
| Vite | 5.0 | 빌드 도구 |
| React Router DOM | 6.20 | 라우팅 |

---

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── OAuthProviderButton.tsx   # OAuth 제공자 버튼 컴포넌트
│   │   └── OAuthProviderButton.css   # 컴포넌트 스타일
│   │
│   ├── pages/
│   │   ├── Login.tsx                 # 로그인 페이지
│   │   ├── Login.css
│   │   ├── SignUp.tsx                # 회원가입 페이지
│   │   ├── SignUp.css
│   │   ├── Pending.tsx               # 승인 대기 페이지
│   │   ├── Pending.css
│   │   ├── Success.tsx               # 로그인 성공 페이지
│   │   ├── Success.css
│   │   ├── Rejected.tsx              # 거부됨 페이지
│   │   ├── Rejected.css
│   │   ├── Admin.tsx                 # 관리자 대시보드
│   │   └── Admin.css
│   │
│   ├── config/
│   │   └── oauthProviders.ts         # OAuth 제공자 설정
│   │
│   ├── types/
│   │   └── auth.ts                   # TypeScript 타입 정의
│   │
│   ├── App.tsx                       # 메인 앱 + 라우팅
│   ├── App.css                       # 앱 스타일
│   ├── main.tsx                      # 진입점
│   └── index.css                     # 전역 스타일
│
├── index.html
├── nginx.conf                        # 프로덕션 Nginx 설정
├── nginx.dev.conf                    # 개발용 Nginx 설정
├── vite.config.ts                    # Vite 설정
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## 라우팅 구조

모든 라우트는 `/auth` basename으로 설정되어 있습니다.

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/auth/login` | Login | 로그인 페이지 |
| `/auth/signup` | SignUp | 회원가입 페이지 |
| `/auth/pending` | Pending | 승인 대기 안내 |
| `/auth/success` | Success | 로그인 성공 |
| `/auth/rejected` | Rejected | 접근 거부 안내 |
| `/auth/admin` | Admin | 관리자 대시보드 |

---

## 페이지별 상세

### 1. Login / SignUp 페이지

**기능**:
- OAuth 제공자 선택 UI 표시
- Google 로그인 활성화
- Naver, Facebook, LINE은 "Coming Soon" 표시

**OAuth 플로우**:
1. 사용자가 "Continue with Google" 클릭
2. `window.location.href = '/auth/google'`로 백엔드 OAuth 시작
3. 백엔드에서 처리 후 상태에 따라 리다이렉트

**디자인**:
- 그라데이션 배경 (Login: 보라색, SignUp: 핑크색)
- 반응형 레이아웃

### 2. Pending 페이지

**표시 조건**: 사용자 `status === 'pending'`

**내용**:
- 승인 대기 중 안내 메시지
- "관리자가 확인 후 승인할 예정입니다" 안내
- Sign Out 버튼

### 3. Success 페이지

**표시 조건**: 사용자 `status === 'approved'`

**내용**:
- 사용자 이메일 표시
- 역할 배지 (Admin / User)
- 관리자인 경우 "Go to Admin Dashboard" 버튼
- Sign Out 버튼

### 4. Rejected 페이지

**표시 조건**: 사용자 `status === 'rejected'`

**내용**:
- 접근 거부 안내
- 관리자 문의 안내
- Return to Login 버튼

### 5. Admin 대시보드

**접근 권한**: `role === 'admin'` AND `status === 'approved'`

**기능**:

| 기능 | 설명 |
|------|------|
| 통계 카드 | Total, Pending, Approved, Rejected 사용자 수 |
| Pending 탭 | 승인 대기 사용자 목록 |
| All Users 탭 | 전체 사용자 목록 |
| 승인/거부 | 각 사용자에 대한 승인(✓) / 거부(✗) 버튼 |

**사용자 테이블 컬럼**:
- Email
- Name
- Role (admin/user 배지)
- Status (pending/approved/rejected 배지)
- Created (생성일)
- Actions (승인/거부 버튼)

---

## OAuth 제공자 설정

**파일**: `src/config/oauthProviders.ts`

```typescript
interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  color: string;
  url?: string;
}
```

| 제공자 | 상태 | 엔드포인트 |
|--------|------|-----------|
| Google | 활성화 | `/auth/google` |
| Naver | TBD | - |
| Facebook | TBD | - |
| LINE | TBD | - |

---

## API 호출

Frontend에서 호출하는 Backend API:

| API | 메소드 | 용도 |
|-----|--------|------|
| `/auth/google` | GET | Google OAuth 시작 |
| `/auth/logout` | POST | 로그아웃 |
| `/auth/me` | GET | 현재 사용자 정보 |
| `/auth/status` | GET | 인증 상태 확인 |
| `/admin/stats` | GET | 사용자 통계 |
| `/admin/users` | GET | 전체 사용자 목록 |
| `/admin/users/pending` | GET | 승인 대기 목록 |
| `/admin/users/:id/approve` | POST | 사용자 승인 |
| `/admin/users/:id/reject` | POST | 사용자 거부 |

**API 호출 시 주의사항**:
- 모든 요청에 `credentials: 'include'` 옵션 필요 (쿠키 전달)

---

## Vite 설정

**파일**: `vite.config.ts`

### 주요 설정

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/auth/',
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

### 프록시 설정 (개발 환경)

| 경로 | 프록시 대상 |
|------|------------|
| `/auth/*` | `http://localhost:3000/auth/*` |
| `/admin/*` | `http://localhost:3000/admin/*` |

---

## 프로젝트 설정 및 실행

### 설치

```bash
cd frontend
npm install
```

### 개발 서버 실행

```bash
# Backend가 먼저 실행되어야 함
npm run dev

# http://localhost:5173/auth/login 에서 접속
```

### 프로덕션 빌드

```bash
npm run build

# 빌드 결과: dist/ 폴더
```

### 빌드 미리보기

```bash
npm run preview

# http://localhost:4173 에서 확인
```

---

## Docker 빌드

### Dockerfile 구조

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 빌드 명령

```bash
docker build -t auth-frontend .
docker run -p 8080:80 auth-frontend
```

---

## 디자인 시스템

### 색상 팔레트

| 페이지 | 배경 그라데이션 |
|--------|----------------|
| Login | `#667eea → #764ba2` (보라색) |
| SignUp | `#f093fb → #f5576c` (핑크색) |
| Pending | `#ffa751 → #ffe259` (주황색) |
| Success | `#11998e → #38ef7d` (녹색) |
| Rejected | `#eb3349 → #f45c43` (빨강색) |

### 반응형 브레이크포인트

| 크기 | 기준 |
|------|------|
| Desktop | `> 768px` |
| Mobile | `≤ 640px` |

---

## 트러블슈팅

### OAuth 리다이렉트 오류

**증상**: Google 로그인 후 404

**확인사항**:
1. Backend가 `http://localhost:3000`에서 실행 중인지 확인
2. `vite.config.ts` 프록시 설정 확인
3. Google Console의 Redirect URI 확인

### API 호출 실패

**증상**: "Failed to load" 오류

**확인사항**:
1. 쿠키가 설정되었는지 확인 (개발자 도구 → Application → Cookies)
2. `credentials: 'include'` 옵션이 포함되어 있는지 확인
3. Backend 로그 확인

### Admin 대시보드 접근 불가

**증상**: 403 Forbidden 또는 빈 화면

**확인사항**:
1. 로그인한 사용자가 `role: 'admin'`인지 확인
2. `/auth/me` API 응답 확인
3. JWT 토큰 만료 여부 확인

---

## TODO: 코드 레벨 개선 필요 항목

### 우선순위 중간 (P1)

#### CSS 파일 구조 개선

현재 각 페이지별로 CSS 파일이 분리되어 있음:

```
frontend/src/pages/
├── Admin.css
├── Login.css
├── Pending.css
├── Rejected.css
├── SignUp.css
└── Success.css
```

**권장 개선 방안**:
- CSS Modules 도입 (`*.module.css`)
- 또는 styled-components/Tailwind CSS 전환
- 공통 스타일 변수/테마 파일 분리

### 우선순위 낮음 (P2)

- 컴포넌트 테스트 코드 작성 (React Testing Library)
- Storybook 도입으로 컴포넌트 문서화

---

## 참고 문서

- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 전체 프로젝트 구조
- [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) - 백엔드 상세 구조
- [refactoring_result.md](./refactoring_result.md) - 리팩토링 내역 및 TODO

---

**Last Updated**: 2025-12-28
