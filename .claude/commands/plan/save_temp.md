---
agent: agent
description: "작업 도중 다음에 계속 작업하기 위해 상황을 보존한다."
---

다음과 같이 상태 저장 파일을 생성한다.

▼구체적인 순서

1. 최종 커밋 이후 현재까지 진행된 current_sprint의 내용을 중간 저장하고 다음에 이어서 작업하기 위한 이력을 남긴다.
   - 전체 내용을 확인해서 단계별로 상세히 남긴다. 
2. 파일명은 /docs/current_sprint/savetempMMDDNN.md으로 신규 order파일을 작성한다.
   1. (NN은 당일의 작업번호를 리니어하게 증가시킨다. ex : savetemp121901.md)
   2. 최신 order파일의 파일명을 기입하고, 해당 order파일을 포함함을 명시한다.
3. CLAUDE.md의 커밋 룰에 따라 커밋로그를 작성한다.