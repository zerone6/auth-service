# AGENTS 룰

- 특별한 이유가 없다면 기본적인 커뮤니케이션은 한글로 해라. 기술용어는 영어나 외국어 원문을 그대로 쓴다.

- 커밋 로그/메시지 작성
  - 요청 시 staged 변경(git diff --staged)와 새로/수정된 파일 내용을 검토해 커밋 로그를 작성한다.
  - 로그 파일 경로: `/docs/taskLog/commitMMDDNN.md` (예: commit121401.md, Asia/Tokyo 기준, NN은 당일 01부터 증가). 폴더가 없으면 생성.
  - log example
    refactor: Centralize agent configuration and clean up temporary files

    Move agent rules documentation to .claude directory for better project
    organization. Remove temporary commit logs that are no longer needed.
    Add shell script for linking agent configuration across different AI
    coding assistants (Claude, Cursor).

    Changes:
    - Relocate AGENTS.md → .claude/AGENTS.origin.md
    - Delete commit_log_122001.log and commit_log_122002.log
    - Add .claude/link-agents.sh for configuration management

- 작업 명령서(order) 작성
  - 사용자가 특정 업무를 프롬프트해서 작업 명령서 작성을 요청하는 경우에는 아래 룰을 따른다. : 예 ("계산기 화면을 그리기 위한 작업 명령서를 작성해줘.")
  - 요청 시 `/docs/current_sprint/orderMMDDNN.md`에 작성(Asia/Tokyo 기준, NN은 당일 01부터 증가). 폴더가 없으면 생성.
  - 코드 수준 구현 대신 추상적 수준(함수명 등)으로 기술한다.
  - /docs/structure에서 현재 구조를 참고해서, 중복을 없에고 적절한 위치에 기능을 배치한다.
  - TODO.md 파일을 참고해서, 이번 작업에 추가해야할 항목이 있다면 order에 반영한다.
  - 섹션 순서:
    1. 날짜 (YYYY-MM-DD, Asia/Tokyo), 현재 local main의 commit id
    2. 사용자 오더(프롬프트 그대로)
    3. 변경 요약(핵심 3줄 이내)
    4. 개요 및 Task 목표 : 상세히 작성한다.
    5. 사용자 오더에 대한 문제점 : 사용자 오더에 대한 문제점이나 과제가 있을때 작성한다. 이때 AI가 판단해서 이 문제가 큰 경우 대안이 있거나 하면, 아래 항목들을 작성하지 말고, 오더에 대한 문제점을 분석하고 대안을 제시하고 마무리한다.
    6. 범위 및 산출물
    7. 변경 파일 목록(A/M/D, 경로, 1줄 요약)
       1. 변경 파일별로 어떤 내요이 변경되는지 1줄 요약
       2. 새로 추가되는 폴더나 폴더 변경이 있을때도 마찬가지로 요약
    8.  구현 계획(설계 의도 포함)
    9.  테스트 플랜(무엇을 어떻게 확인할지)
       1. AI가 자동화 테스트할수 있는 영역과 사용자가 수동으로테스트할수 있는 영역을 나눠서 계획을 작성한다.
    10. 실행/검증 결과(실행 명령어와 결과/실패 원인)
    11. 작업 순서(체크리스트 권장)
        1. 기능 테스트가 순서대로 진행될수 있도록 작업을 세분화해서 Phase로 분류하고 각 Phase에서는 A의 자동테스트, 수동 테스트 결과를 확인해서 다음 페이즈로의 진행 여부에 대한 오더에 따라 진행한다.
    12. 리스크 및 롤백
    13. Known Issues / TODO
