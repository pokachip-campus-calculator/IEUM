# Git 전략

> 브랜치 관리, 커밋 메시지, PR 규칙. FE/BE 각자 다르게 구성해도 됩니다. 아래는 백엔드(`backend/`)가 실제로 쓰고 있는 방식입니다.

## 1. 브랜치 전략
| 브랜치 | 용도 |
|---|---|
| main | 최종 완성본. 배포할 때만 develop에서 합친다 |
| develop | 팀 작업이 모이는 곳. PR은 항상 develop으로 보낸다 |
| feature/역할-이슈번호-내용 | 기능 개발. 항상 develop에서 만든다 |

- 역할은 `front`, `back`, `db`, 문서 작업은 `docs`를 쓴다. 예: `feature/back-111-spec-alignment`, `docs/readme`
- 이슈 하나에 브랜치 하나, PR 하나로 간다.
- 작업 시작 전에 `git switch develop` → `git pull`로 최신을 받은 뒤 브랜치를 만든다.
- 자기 폴더만 수정한다(frontend/ 프론트, backend/ 백엔드, db/ DB).
- 이전 이슈의 PR이 아직 머지되지 않았고 그 코드가 필요하면 그 브랜치 위에서 새 브랜치를 만든다.

## 2. 커밋 메시지 규칙
`타입: 한글 설명 #이슈번호`

| 타입 | 언제 | 예시 |
|---|---|---|
| feat | 기능 추가 | feat: 탈퇴 요청에 acknowledged 확인 값을 필수로 추가 #111 |
| fix | 버그 수정, 기준에 맞춘 수정 | fix: 학습 완료를 completed_at 기준으로 세도록 11·17·18 수정 #111 |
| test | 테스트 추가·수정 | test: mock 삭제에 맞춰 테스트 설정과 연습 콘텐츠 파일 이동 #107 |
| docs | 문서 수정 | docs: README 실행 방법 추가 |
| refactor | 동작 변화 없는 코드 정리 | refactor: 개발용 mock 컨트롤러와 설정 삭제 #107 |
| sql | SQL 파일 변경 | sql: 연습 콘텐츠 시드 추가 (V5) |
| style | 화면 모양(CSS·문구) 변경 (프론트) | style: 문구 카드 크기 축소 #96 |
| chore | 설정·도구 변경 | chore: CodeRabbit 리뷰 설정 추가 #113 |

- 목적별로 나눠서 커밋한다(기능 / 테스트 / Postman·문서).
- `git add .` 대신 파일을 지정해서 올린다. `.env`, `.idea/`, `.claude/`는 올리지 않는다.
- 비밀번호·JWT 비밀키는 `.env`에만 적고 절대 커밋하지 않는다(레포가 Public).

## 3. PR 규칙
- 제목 형식: 커밋 메시지와 같은 `타입: 한글 설명 #이슈번호`
- 대상 브랜치: `develop` (main으로 직접 보내지 않는다)
- 본문: `.github/pull_request_template.md`를 채운다. 맨 위에 `Closes #이슈번호`를 넣어 머지하면 이슈가 닫히게 한다.
- 리뷰: PR을 올리면 CodeRabbit이 자동으로 코드 리뷰를 단다(`.coderabbit.yaml`, 대상은 develop으로 가는 PR). 사람 리뷰어·승인 인원은 팀에서 정한다.
- 머지 방식: GitHub의 Merge pull request(머지 커밋). 머지는 작성자가 확인한 뒤 직접 한다.
- PR을 올린 뒤 댓글을 하나 남긴다: 한 일, 자동 테스트 결과, 수동 테스트 순서(체크리스트), 팀원과 확인할 것, 유의사항.
- `develop`과 충돌이 나면 임의로 해결하지 말고 원인과 해결 방법을 먼저 팀에 공유한다.

## 4. Issue / PR 템플릿
- **이슈** (`.github/ISSUE_TEMPLATE/task.md`, 라벨 `task`): `## 무엇을` / `## 끝나면 보이는 것`(체크리스트) / `## 담당`. 제목은 `[작업] 내용`이고, 한 이슈에서 여러 작업을 하면 제목에 ① ② ③으로 나눠 적는다.
- **PR** (`.github/pull_request_template.md`): `이 PR 이 닫는 이슈`(`Closes #`) / `바꾼 것` / `리뷰어가 확인할 것`(체크리스트 3개).
- **이슈 완료 댓글** (`.github/issue_done_comment_template.md`): 작업 확인이 끝나면 이슈에 단다. 한 것, 이슈 체크리스트 결과, 테스트, 프론트 참고, 남은 것 / 주의, 관련 PR을 적는다.
