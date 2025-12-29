# Multi-Provider OAuth Migration Guide

이 가이드는 auth-service를 Multi-Provider OAuth 지원 버전으로 마이그레이션하는 방법을 설명합니다.

## 변경 요약

| 변경 전 | 변경 후 |
|--------|--------|
| `google_id` 컬럼 | `provider` + `provider_id` 컬럼 |
| Google OAuth만 지원 | Google, Naver, Line, Apple, Kakao, GitHub 지원 가능 |
| `findUserByGoogleId()` | `findUserByProvider()` (deprecated 함수 유지) |

## 1. 데이터베이스 마이그레이션

### 1.1 백업 (필수)

```bash
# 데이터베이스 백업
pg_dump -h localhost -U postgres auth > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 1.2 마이그레이션 실행

```bash
# 마이그레이션 스크립트 실행
psql -h localhost -U postgres -d auth -f database/migrations/001_multi_provider.sql
```

### 1.3 마이그레이션 확인

```sql
-- 스키마 확인
\d users

-- 데이터 확인
SELECT id, provider, provider_id, email FROM users LIMIT 5;

-- 프로바이더별 통계
SELECT provider, COUNT(*) FROM users GROUP BY provider;
```

### 1.4 롤백 (필요시)

```bash
# 롤백 스크립트 실행 (Google 사용자만 있는 경우에만 가능)
psql -h localhost -U postgres -d auth -f database/migrations/001_multi_provider_rollback.sql
```

> ⚠️ **주의**: 롤백은 모든 사용자가 `provider='google'`인 경우에만 가능합니다.

## 2. 코드 변경 사항

### 2.1 User 인터페이스

```typescript
// Before
interface User {
  id: number;
  google_id: string;
  email: string;
  // ...
}

// After
type AuthProvider = 'google' | 'naver' | 'line' | 'apple' | 'kakao' | 'github';

interface User {
  id: number;
  provider: AuthProvider;
  provider_id: string;
  email: string;
  // ...
}
```

### 2.2 사용자 조회

```typescript
// Before
import { findUserByGoogleId } from './db/queries';
const user = await findUserByGoogleId(googleId);

// After
import { findUserByProvider } from './db/queries';
const user = await findUserByProvider('google', providerId);
```

### 2.3 사용자 생성

```typescript
// Before
import { createUser } from './db/queries';
const user = await createUser(googleId, email, name, pictureUrl);

// After
import { createUser } from './db/queries';
const user = await createUser('google', providerId, email, name, pictureUrl);
```

## 3. Breaking Changes

| 항목 | 변경 내용 |
|------|----------|
| `User.google_id` | 삭제됨 → `User.provider` + `User.provider_id` 사용 |
| `findUserByGoogleId()` | deprecated → `findUserByProvider('google', id)` 사용 |
| `createUser()` 시그니처 | `(googleId, email, ...)` → `(provider, providerId, email, ...)` |

## 4. 하위 호환성

### Deprecated 함수

~~다음 함수는 하위 호환성을 위해 유지되지만, 향후 버전에서 제거될 예정입니다:~~

> **Note**: `findUserByGoogleId()` 함수는 v2.0.0에서 완전히 제거되었습니다.
> 모든 코드에서 `findUserByProvider('google', googleId)`를 사용하세요.

## 5. 새로운 프로바이더 추가 방법

### 5.1 데이터베이스 수정 (필요시)

새 프로바이더가 CHECK 제약 조건에 없으면 추가:

```sql
ALTER TABLE users DROP CONSTRAINT check_provider_values;
ALTER TABLE users ADD CONSTRAINT check_provider_values
CHECK (provider IN ('google', 'naver', 'line', 'apple', 'kakao', 'github', 'new_provider'));
```

### 5.2 타입 업데이트

```typescript
// queries.ts
export type AuthProvider = 'google' | 'naver' | 'line' | 'apple' | 'kakao' | 'github' | 'new_provider';
```

### 5.3 Passport Strategy 추가

```typescript
// passport.ts에 새 Strategy 추가
import { Strategy as NewProviderStrategy } from 'passport-new-provider';

passport.use(
  new NewProviderStrategy(
    { /* config */ },
    async (accessToken, refreshToken, profile, done) => {
      const user = await findUserByProvider('new_provider', profile.id);
      // ...
    }
  )
);
```

## 6. 테스트

### 6.1 단위 테스트 실행

```bash
cd backend
npm test
```

### 6.2 E2E 테스트

1. Google 로그인 테스트
2. Admin 기능 테스트
3. 기존 사용자 로그인 확인

## 7. 문제 해결

### 마이그레이션 실패

```sql
-- 트랜잭션 상태 확인
SELECT * FROM pg_stat_activity WHERE datname = 'auth';

-- 트랜잭션 롤백
ROLLBACK;
```

### 기존 사용자 로그인 불가

1. `provider` 값이 `'google'`인지 확인
2. `provider_id` 값이 기존 `google_id`와 일치하는지 확인

```sql
SELECT id, provider, provider_id FROM users WHERE email = 'user@example.com';
```

---

**마이그레이션 날짜**: 2025-12-28
**버전**: 2.0.0 (Multi-Provider OAuth)
