# Phase 4: Frontend 구현 완료

## ✅ 구현된 기능

### 1. React + TypeScript + Vite 프로젝트 설정

**기술 스택:**
- React 18.2
- TypeScript 5.2
- Vite 5.0
- React Router DOM 6.20

**프로젝트 구조:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── OAuthProviderButton.tsx    # OAuth 제공자 버튼
│   │   └── OAuthProviderButton.css
│   ├── pages/
│   │   ├── Login.tsx                  # 로그인 페이지
│   │   ├── SignUp.tsx                 # 회원가입 페이지
│   │   ├── Pending.tsx                # 승인 대기 페이지
│   │   ├── Success.tsx                # 로그인 성공 페이지
│   │   ├── Rejected.tsx               # 거부됨 페이지
│   │   └── Admin.tsx                  # 관리자 대시보드
│   ├── config/
│   │   └── oauthProviders.ts          # OAuth 제공자 설정
│   ├── types/
│   │   └── auth.ts                    # TypeScript 타입 정의
│   ├── App.tsx                        # 메인 앱 컴포넌트
│   ├── main.tsx                       # 진입점
│   └── index.css                      # 전역 스타일
├── index.html
├── vite.config.ts                     # Vite 설정 (프록시 포함)
├── package.json
└── tsconfig.json
```

---

## 🎨 페이지 구성

### 1. 로그인/회원가입 페이지 (`/login`, `/signup`)

**기능:**
- 여러 OAuth 제공자 선택 UI
- Google (활성화), Naver, Facebook, LINE (TBD)
- 비활성화된 제공자는 "Coming Soon" 배지 표시
- Sign In ↔ Sign Up 전환

**디자인:**
- 그라데이션 배경 (Login: 보라색, SignUp: 핑크색)
- 카드 형태의 중앙 정렬 레이아웃
- 반응형 디자인 (모바일 지원)
- 다크모드 자동 지원

**OAuth 제공자 설정** (`src/config/oauthProviders.ts`):
```typescript
[
  {
    id: 'google',
    name: 'Google',
    icon: '🔍',
    enabled: true,      // ← 활성화
    color: '#4285F4',
    url: '/auth/google',
  },
  {
    id: 'naver',
    name: 'Naver',
    icon: '🟢',
    enabled: false,     // ← TBD
    color: '#03C75A',
  },
  // ... Facebook, LINE (모두 enabled: false)
]
```

### 2. 승인 대기 페이지 (`/pending`)

**표시 조건:**
- 신규 사용자가 Google OAuth로 로그인 완료
- `status: 'pending'` 상태

**내용:**
- ⏳ 아이콘 (펄스 애니메이션)
- 승인 대기 안내 메시지
- 다음 단계 설명 (관리자 승인 → 이메일 알림)
- Sign Out 버튼

### 3. 로그인 성공 페이지 (`/success`)

**표시 조건:**
- `status: 'approved'` 상태

**내용:**
- ✅ 아이콘 (체크마크 애니메이션)
- 사용자 이메일 표시
- 역할 배지 (👑 Admin / 👤 User)
- 관리자인 경우: "Go to Admin Dashboard" 버튼
- Sign Out 버튼

### 4. 거부됨 페이지 (`/rejected`)

**표시 조건:**
- `status: 'rejected'` 상태

**내용:**
- ❌ 아이콘 (흔들림 애니메이션)
- 접근 거부 안내
- 관리자 문의 안내
- Return to Login 버튼

### 5. 관리자 대시보드 (`/admin`)

**접근 권한:**
- `role: 'admin'` + `status: 'approved'` 필수

**기능:**

#### 통계 카드
- Total Users (총 사용자 수)
- Pending (승인 대기)
- Approved (승인됨)
- Rejected (거부됨)

#### 탭 전환
- **Pending 탭**: 승인 대기 중인 사용자만 표시
- **All Users 탭**: 모든 사용자 표시

#### 사용자 테이블
| Column | 내용 |
|--------|------|
| Email | 사용자 이메일 |
| Name | 이름 (없으면 `-`) |
| Role | admin/user 배지 |
| Status | pending/approved/rejected 배지 |
| Created | 생성일 |
| Actions | ✓ 승인 / ✗ 거부 버튼 (pending만) |

#### 승인/거부 기능
- **승인 (✓ 버튼)**: 즉시 `status`를 `approved`로 변경
- **거부 (✗ 버튼)**: 확인 후 `status`를 `rejected`로 변경
- 자동 새로고침: 승인/거부 후 자동으로 데이터 갱신

---

## 🔄 OAuth 플로우 (Frontend 관점)

```
[사용자]
   │
   ├─→ /login 또는 /signup
   │      │
   │      v
   │   OAuth 제공자 선택
   │      │
   │      ├─→ Google 클릭
   │      │   └─→ window.location.href = '/auth/google'
   │      │
   │      v
   │   [Backend OAuth 처리]
   │      │
   │      v
   │   리다이렉트 (쿠키에 JWT 토큰 설정됨)
   │      │
   │      ├─→ status: 'pending' → /pending
   │      ├─→ status: 'approved' → /success
   │      └─→ status: 'rejected' → /rejected
```

---

## ⚙️ Vite 설정 (프록시)

**`vite.config.ts`:**
```typescript
export default defineConfig({
  plugins: [react()],
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
      '/verify': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

**효과:**
- `/auth/*` 요청 → `http://localhost:3000/auth/*`로 프록시
- `/admin/*` 요청 → `http://localhost:3000/admin/*`로 프록시
- CORS 문제 해결
- 쿠키 전달 자동 처리 (`credentials: 'include'`)

---

## 🎨 디자인 시스템

### 색상 팔레트

| 페이지 | 배경 그라데이션 | 포인트 색상 |
|--------|----------------|------------|
| Login | `#667eea → #764ba2` | 보라색 |
| SignUp | `#f093fb → #f5576c` | 핑크색 |
| Pending | `#ffa751 → #ffe259` | 주황색 |
| Success | `#11998e → #38ef7d` | 녹색 |
| Rejected | `#eb3349 → #f45c43` | 빨강색 |

### 애니메이션
- **Pending**: 펄스 애니메이션 (⏳)
- **Success**: 회전 체크마크 애니메이션 (✅)
- **Rejected**: 흔들림 애니메이션 (❌)

### 반응형 브레이크포인트
- Desktop: `> 768px`
- Mobile: `≤ 640px`

---

## 📦 설치 및 실행

### 1. 패키지 설치

```bash
cd /Users/seonpillhwang/GitHub/homegroup/auth-service/frontend
npm install
```

### 2. 개발 서버 시작

**먼저 Backend 실행 (필수):**
```bash
# Terminal 1
cd /Users/seonpillhwang/GitHub/homegroup/auth-service/backend
npm run dev
```

**Frontend 실행:**
```bash
# Terminal 2
cd /Users/seonpillhwang/GitHub/homegroup/auth-service/frontend
npm run dev
```

### 3. 브라우저 접속

```
http://localhost:5173/login
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 초기 관리자 로그인

1. `http://localhost:5173/login` 접속
2. "Continue with Google" 클릭
3. Google 로그인 (`.env`의 `INITIAL_ADMIN_EMAIL`과 동일한 이메일)
4. → `/success`로 리다이렉트
5. "Go to Admin Dashboard" 버튼 표시 확인
6. Admin Dashboard 접속

**예상 결과:**
- 사용자 자동 생성
- `role: 'admin'`, `status: 'approved'`
- 즉시 Admin Dashboard 접근 가능

### 시나리오 2: 일반 사용자 가입

1. `http://localhost:5173/signup` 접속
2. "Continue with Google" 클릭
3. Google 로그인 (다른 이메일)
4. → `/pending`으로 리다이렉트

**예상 결과:**
- 사용자 생성
- `role: 'user'`, `status: 'pending'`
- 승인 대기 페이지 표시

### 시나리오 3: 관리자가 사용자 승인

1. 관리자로 Admin Dashboard 접속
2. "Pending" 탭 확인
3. 대기 중인 사용자 확인
4. ✓ 버튼 클릭하여 승인
5. 통계 및 테이블 자동 업데이트 확인

**예상 결과:**
- `status: 'pending'` → `'approved'`
- Pending 카운트 감소, Approved 카운트 증가
- 해당 사용자 Pending 탭에서 사라짐

### 시나리오 4: 승인된 사용자 재로그인

1. 승인된 일반 사용자로 로그인
2. → `/success`로 리다이렉트
3. "Go to Admin Dashboard" 버튼 없음 확인
4. Sign Out 클릭

---

## 🔐 보안 고려사항

### 1. JWT 쿠키 기반 인증
- HttpOnly 쿠키 사용 (XSS 방지)
- `credentials: 'include'` 옵션으로 모든 API 요청에 쿠키 포함

### 2. Admin 접근 제어
- Frontend에서 권한 확인 (UI 표시용)
- Backend에서 실제 권한 검증 (`requireAdmin` 미들웨어)

### 3. CORS 설정
- Backend에서 허용된 Origin만 접근 가능
- Vite 프록시로 개발 환경 CORS 문제 해결

---

## 🎯 다음 OAuth 제공자 추가 방법

### Naver OAuth 추가 예시

**1. Backend에 Naver Strategy 추가** (`backend/src/services/passport.ts`):
```typescript
import { Strategy as NaverStrategy } from 'passport-naver';

passport.use(
  new NaverStrategy({
    clientID: config.naver.clientId,
    clientSecret: config.naver.clientSecret,
    callbackURL: config.naver.callbackUrl,
  }, ...)
);
```

**2. Backend 라우트 추가** (`backend/src/routes/auth.ts`):
```typescript
router.get('/naver', passport.authenticate('naver'));
router.get('/naver/callback', passport.authenticate('naver', ...), ...);
```

**3. Frontend 설정 업데이트** (`frontend/src/config/oauthProviders.ts`):
```typescript
{
  id: 'naver',
  name: 'Naver',
  icon: '🟢',
  enabled: true,          // ← false에서 true로 변경
  color: '#03C75A',
  url: '/auth/naver',     // ← URL 추가
}
```

**완료!** Sign In/Sign Up 페이지에서 Naver 버튼이 활성화됩니다.

---

## 🚨 트러블슈팅

### npm install 실패

```bash
# Node.js 버전 확인 (18 이상 권장)
node --version

# 캐시 클리어
npm cache clean --force
npm install
```

### Vite 프록시 오류

**증상:** `/auth/google` 요청이 404

**확인:**
1. Backend가 `http://localhost:3000`에서 실행 중인지 확인
2. `vite.config.ts`의 프록시 설정 확인
3. Frontend 재시작: `Ctrl+C` → `npm run dev`

### OAuth 리다이렉트 오류

**증상:** Google 로그인 후 404

**확인:**
1. Backend `.env`의 `GOOGLE_CALLBACK_URL` 확인
2. Google Console의 Redirect URI 확인
3. Backend 로그 확인

### Admin Dashboard 접근 불가

**증상:** "Failed to load admin data"

**확인:**
1. 로그인한 사용자가 `role: 'admin'`인지 확인
2. 쿠키가 설정되었는지 확인 (개발자 도구 → Application → Cookies)
3. Backend `/admin/*` 엔드포인트가 동작하는지 확인

---

## 📖 참고 문서

- [PHASE3-OAUTH-IMPLEMENTATION.md](./PHASE3-OAUTH-IMPLEMENTATION.md) - Backend OAuth 구현
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)

---

**Phase 4 Status**: ✅ Frontend Complete
**Next**: Phase 5 - Nginx Integration (선택)
**Last Updated**: 2025-11-22
