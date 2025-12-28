---
agent: agent
description: "Sprint 종료 시점에 따라 문서 정리 및 커밋 로그 작성 절차입니다."
---

다음과 같이 Sprint 종료 작업을 수행합니다.

▼구체적인 순서
1. current_sprint/ 정리:
   - 완료된 ORDER/REFACTORING 파일 검토
   - 작업 결과 섹션 완성

2. Sprint 요약 생성:
   - docs/sprints/SPRINT_{YYYY_MM_DD}.md 생성
   - 주요 성과, 변경 파일 목록, 다음 계획 작성

3. 파일 이동:
   - current_sprint/ORDER*.md → docs/sprints/sprint{N}/
   - current_sprint/REFACTORING*.md → docs/sprints/sprint{N}/
   - 또는 current_sprint/backup/ 으로 백업

4. README.md 업데이트:
   - "최근 Sprint" 섹션에 1-2줄 추가
   - Sprint 요약 파일 링크 추가

5. TODO.md 정리:
   - 완료 항목 제거
   - 새로운 Technical Debt 추가

6. Git 커밋 로그 작성:
   - CLAUDE.md파일의 커밋 로그 룰에 따라 작성 
```

## 📁 문서 구조

```
docs/
├── BACKEND_API.md           # Backend API 명세 (지속 관리)
├── BACKEND_STRUCTURE.md     # Backend 구조 (지속 관리)
├── FRONTEND_ROUTES.md       # Frontend 라우트 (지속 관리)
├── FRONTEND_STRUCTURE.md    # Frontend 구조 (지속 관리)
├── ARCHITECTURE.md          # 전체 아키텍처 (지속 관리)
├── TODO.md                  # 미루어진 작업 (지속 관리)
├── DOCORDER.md              # 문서 관리 규칙 (AI용)
├── DOCOPERATION.md          # 운영 가이드 (사람용)
├── current_sprint/          # 현재 Sprint 작업 문서
│   ├── ORDER{MMDD}.md       # 기능 개발 문서
│   ├── REFACTORING{MMDD}.md # 리팩토링 문서
│   └── backup/              # 이전 Sprint 백업
└── sprints/                 # 완료된 Sprint 아카이브
    ├── sprint1/             # Sprint 1 (2025-12-01 ~ 2025-12-09)
    │   ├── ORDER*.md
    │   └── REFACTORING*.md
    └── SPRINT_2025_12_09.md # Sprint 1 요약
```

## ✍️ 작성 스타일 가이드

### Markdown 규칙
```markdown
# 제목: H1 (한 문서에 한 개)
## 섹션: H2
### 하위 섹션: H3

**강조**: 굵게
`코드`: 인라인 코드
```코드블럭```

- 리스트: 하이픈
1. 번호: 숫자

[링크 텍스트](URL)
```

### 코드블럭
```
언어 명시:
```javascript
function example() {}
```

```http
GET /api/endpoint
```

```sql
SELECT * FROM table;
```
```

### 표 형식
```markdown
| 컬럼1 | 컬럼2 | 컬럼3 |
|------|------|------|
| 값1  | 값2  | 값3  |
```

## 🚫 금지 사항

1. **README.md 상세 내용**: README.md에 상세 구현 내용 금지 (링크만)
2. **중복 문서화**: 같은 내용을 여러 파일에 반복 금지
3. **하드코딩 경로**: 파일 경로는 상대 경로 사용
4. **오래된 날짜**: 문서 업데이트 시 날짜 갱신 필수
5. **미완성 커밋**: 문서 업데이트 없이 코드만 커밋 금지