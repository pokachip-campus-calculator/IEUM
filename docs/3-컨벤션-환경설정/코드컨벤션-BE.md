# 코드 컨벤션 (BE)

> 코드 가독성과 일관성을 위한 규칙. 개발 착수 전에 정하고 반드시 지킵니다. 아래는 `backend/` 코드에서 실제로 지키고 있는 규칙입니다. (Spring Boot · Java 21 · JPA · MySQL 8)

## 1. 네이밍 컨벤션
| 대상 | 규칙 | 예시 |
|---|---|---|
| 클래스 | PascalCase | RecordService, TeacherInboxController |
| 메서드/변수 | camelCase | findByUserId, doneCount |
| 상수 | UPPER_SNAKE_CASE | PREVIEW_LENGTH, NOTE_MAX |
| 테이블/컬럼 | snake_case | practice_records, completed_at |
| API 주소 | 소문자·복수 명사, 하위는 `/` | /threads/{id}/messages |
| 요청·응답 클래스 | `…Request`, `…Response` | WithdrawRequest, RecordListResponse |
| 컨트롤러·서비스 | `…Controller`, `…Service` | MeController, UserService |
| 테스트 메서드 | 한글 문장, `_`로 이음 | 확인_값이_false이면_탈퇴는_400_VALIDATION_FAILED와_acknowledged를_준다 |

## 2. 패키지 구조
도메인별로 나누고, 그 안에서 역할별 하위 패키지를 둔다.
```
com.ieum
├─ auth          (controller, dto, jwt, service)   가입·로그인·토큰
├─ user          (controller, dto, entity, repository, service)   내 정보·이음쌤 화면
├─ practice      (controller, dto, entity, repository, service)   연습
├─ record        (controller, dto, entity, repository, service)   학습 기록
├─ home          (controller, dto, service)   홈
├─ message       (controller, dto, entity, repository, service)   쪽지
├─ signal        (entity, repository, service)   신호 검사
├─ notification  (controller, dto, entity, repository, service)   알림
├─ common        ErrorCode, ApiException, ErrorResponse, GlobalExceptionHandler
└─ config        SecurityConfig, TimeConfig, ApiPathConfig
```
- 컨트롤러는 요청을 받아 서비스에 넘기기만 한다. 규칙과 계산은 서비스에 둔다.
- 다른 도메인의 기능은 그 도메인의 서비스·리포지토리를 통해서만 쓴다.

## 3. DTO & Entity 규칙
- 요청·응답 DTO는 Java `record`로 만든다. 입력 검사는 `@NotBlank`, `@Size`, `@Pattern` 같은 검증 어노테이션으로 하고, 메시지는 화면에 그대로 보여 줄 한글 문장으로 쓴다.
- Entity는 DB 테이블과 1:1이다. 값을 마음대로 바꾸는 setter를 열지 않고, 의미가 있는 메서드(`markLogin`, `changeNickname`, `restart`, `complete`)로만 상태를 바꾼다.
- Entity를 그대로 응답으로 내리지 않는다. 응답 DTO로 바꿔서 내린다.
- 시간은 `Clock`을 주입받아 쓴다(`LocalDateTime.now(clock)`). 응답에는 한국 시간 `+09:00`을 붙인 ISO-8601로 내린다.
- 스키마는 `db/` 폴더의 SQL이 기준이다. `ddl-auto: none`이라 엔티티 컬럼이 SQL과 어긋나면 쿼리를 날릴 때 처음 오류가 난다.

## 4. 코드 스타일
- 들여쓰기: 공백 4칸.
- 주석: 클래스마다 맨 위에 4줄 요약을 쓴다.
  ```java
  /**
   * [역할] 무엇을 하는 클래스인가
   * [동작] 어떻게 동작하는가
   * [연결] 누가 부르고 무엇을 부르는가
   * [주의] 알아 둘 규칙·예외
   */
  ```
  단순 enum·record·DTO는 `[역할]` 한 줄만 쓴다. 주석은 한글로, 코드를 읽으면 알 수 있는 것은 적지 않는다.
- 오류 처리:
  - 규칙 위반은 `ApiException(ErrorCode)`로 던지고 `GlobalExceptionHandler`가 `{code, message, fieldErrors}` 형식으로 응답한다.
  - 입력 항목이 틀린 경우는 `ApiException.invalid("필드명", "메시지")`로 `fieldErrors`를 함께 내린다.
  - 새 오류 코드는 `ErrorCode`에만 추가한다. 응답 문구는 합니다체(`~습니다.`/`~요.`)로 마침표로 끝낸다.
  - 서버 내부 오류의 원인(예외 문구)은 응답에 넣지 않고 로그에만 남긴다.
- 인증: `/api/v1/auth/**`만 공개이고 `/api/v1/teacher/**`는 이음쌤만, 나머지는 로그인 사용자가 쓴다(`SecurityConfig`). 컨트롤러는 토큰의 사용자 id(`@AuthenticationPrincipal AuthUser`)만 쓴다.
- 비밀값은 코드에 쓰지 않고 `.env`(환경변수)에서 읽는다.
- 테스트:
  - `./gradlew test`(backend 폴더)가 DB 없이 통과해야 한다. 리포지토리는 `@MockitoBean`으로 대신한다.
  - API마다 `MockMvc` 테스트를 쓰고, 성공·잘못된 입력·권한 오류를 확인한다.
  - 수동 확인용 Postman 컬렉션은 `backend/postman/IEUM-<이슈번호>-<내용>.postman_collection.json`으로 둔다.
- 기타: 요청 밖의 리팩터링은 하지 않는다. 한 이슈에서 한 일 외의 파일은 건드리지 않는다.
