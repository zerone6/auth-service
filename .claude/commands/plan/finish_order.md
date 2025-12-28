---
agent: agent
description: "하나의 작업 계획서를 종료하는 과정"
---

현재 작업중인 order 파일의 전체 내용을 리뷰하여, 작업 내용을 문서화하고, 이후 계획을 만들기 위한 todo를 관리한다.

▼구체적인 순서

1. 작업 내용 정리 -> doc 반영
   1. 작업한 내용을 전체적으로 검토하여 order파일의 내용에 수정이 필요한 부분이 있으면 수정한다
   2. order파일의 작업 결과를 BACKEND_STRUCTURE.md, FRONTEND_STRUCTURE.md파일에 반영한다.
2. TODO.md에 있는 항목중 이번 작업으로 완료된 항목에 대한 체크 및 TODO.md 파일 수정
   1. 이번 작업으로 생긴 TODO를 TODO.md파일에 완료된 항목과, TODO.md로 이동한 항목을 order파일에 명시
      - [x] 백엔드 인증 API 구현 필요 (`/auth/login`, `/auth/me`, `/auth/logout`)
      - [x] 서브 사이트 실제 URL 연결
      
      TODO.md로 이동 세션을 order파일 하단에 추가해서 이동 한내용 기록
      - [ ] 회원가입 기능 추가
      - [ ] 비밀번호 찾기 기능 추가
      - [ ] 소셜 로그인 (OAuth) 연동 고려
      - [ ] 번역 키 추가 (에러 메시지 등)
3. CLAUDE.md파일의 커밋 로그 룰에 따라서 커밋로그를 작성한다.