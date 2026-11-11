# IEUM — Claude 사용 규칙

위기청소년 학습·쪽지 서비스. 1주 3인 프로젝트. Spring Boot(Java 21) · React+TypeScript+Vite · MySQL 8.

팀 규칙(폴더 담당, 브랜치, 커밋 메시지, 비밀값)은 @규칙.md 를 따른다.

## Claude가 지킬 것 (규칙.md에 없는 것)
- .env, .env.local, .env.example은 열거나 읽지 않는다. 값이 필요하면 사용자에게 묻는다.
- 작업 순서: 이슈 확인 → develop에서 feature/이름 브랜치 → 커밋 → develop으로 PR(Closes #번호). merge는 하지 않는다. 푸시 전에 git diff --stat을 보여 주고 확인받는다.

## 토큰 절약
- 저장소 전체를 훑지 않는다. 사용자가 준 파일 경로와 이슈에 나온 파일만 읽고, 경로를 모르면 grep·glob으로 찾은 파일만 연다.
- 이미 읽은 파일은 다시 읽지 않는다. 큰 파일은 줄 범위나 grep으로 필요한 부분만 본다.
- 읽지 않는 것: node_modules, build, dist, .gradle, .idea, 이미지·영상·PDF, package-lock.json. docs/는 사용자가 말한 문서만 연다.
- 명령 출력은 줄인다: 로그는 tail -n 30, 목록은 head, 검색은 grep -n, git은 --stat·--oneline.
- 테스트·빌드는 바꾼 범위만 한 번만 돌린다. 백엔드는 ./gradlew test --tests <이름>, 프론트는 고쳤을 때만 npm run build.
- 요청한 것만 한다. 요청 밖 리팩터링·정리·문서 추가를 하지 않는다. 새 파일을 만들기 전에 이미 있는지 확인한다.
- 불확실하면 한 줄로 묻는다. 큰 변경은 계획을 3~5줄로 먼저 보여 주고 확인받은 뒤 시작한다.

## 답변 방식
- 짧게. 결론 → 바꾼 파일 경로 → 확인한 것 → 남은 것 순서로 쓴다. 바꾼 코드를 다시 붙여 넣지 않는다. 이미 아는 설명은 건너뛴다.
