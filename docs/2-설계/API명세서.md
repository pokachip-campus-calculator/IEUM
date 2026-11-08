# API 명세서

> 프론트엔드-백엔드 데이터 통신 규약. 개발하면서 최신화하고 팀원에게 공유합니다.
> 전체 24개 API의 기준은 `이음 MVP 개발 기준서` 3장입니다(레포에는 올리지 않는 내부 문서). 이 문서는 그 내용을 옮기고, **지금 서버가 실제로 어떻게 응답하는지**(실제 / mock)와 기준서에 없어서 정한 내용을 함께 적습니다.
> 프론트에 전달하는 사용 안내는 [프론트-API연동안내.md](프론트-API연동안내.md)를 보세요.

## 공통 규약
| 항목 | 규약 |
|---|---|
| 기본 경로 | `/api/v1`, JSON(UTF-8). 로컬은 `http://localhost:8080/api/v1` |
| 인증 | `Authorization: Bearer <JWT>`. 가입·로그인만 공개. `/teacher/**`는 role=TEACHER만 |
| 시간 | ISO-8601 한국 시간, 예: `2026-11-04T10:30:00+09:00` |
| 성공 응답 | 본문을 그대로 내린다(봉투 없음). 생성은 201, 본문 없는 성공은 204 |
| 목록 | 페이지네이션 없이 `{"items":[...]}` 한 번에 내린다 |
| 오류 응답 | `{"code":"...","message":"...","fieldErrors":[{"field":"...","message":"..."}]}` (fieldErrors는 입력 오류일 때만). `message`는 화면에 그대로 보여주는 문장 |
| 다시 하기 | 학습자×연습당 기록 1행. 다시 하면 그 행을 초기화해 덮어쓴다 |

### 오류 코드
| code | HTTP | 언제 |
|---|---|---|
| VALIDATION_FAILED | 400 | 입력 형식 오류 (`fieldErrors` 포함) |
| RECORD_INCOMPLETE | 400 | `done:true`인데 필수 선택이 빠짐 |
| UNAUTHORIZED | 401 | 토큰이 없거나 만료됨 |
| BAD_CREDENTIALS | 401 | 아이디·비밀번호가 맞지 않음 |
| GUARDIAN_PENDING | 403 | 만 14세 미만 계정의 보호자 확인 전 로그인 |
| FORBIDDEN | 403 | 다른 사람의 자원이거나 역할이 맞지 않음 |
| NOT_FOUND | 404 | 없는 id |
| LOGIN_ID_TAKEN | 409 | 가입 아이디 중복 |
| NO_TEACHER_AVAILABLE | 409 | 쪽지를 맡을 활성 이음쌤이 없음 |

## API 목록
**구분**: `실제` = DB와 연결된 진짜 구현, `mock` = 고정된 가짜 응답(저장 안 함, 구현 이슈에서 교체 예정).

| 번호 | 기능 | Method | Endpoint | 권한 | 구분 | 이슈 |
|---|---|---|---|---|---|---|
| 01 | 회원 가입 | POST | /auth/signup | 공개 | 실제 | #41 |
| 02 | 로그인 | POST | /auth/login | 공개 | 실제 | #41 |
| 03 | 내 정보 조회 | GET | /me | 로그인 | 실제 | #42 |
| 04 | 내 정보 수정 | PATCH | /me | 로그인 | 실제 | #42 |
| 05 | 비밀번호 변경 | PUT | /me/password | 로그인 | 실제 | #42 |
| 06 | 탈퇴 | POST | /me/withdraw | 학습자 | 실제 | #42 |
| 07 | 홈 | GET | /home | 학습자 | mock (실제 코드 완료, 수동 테스트 대기) | #43 |
| 08 | 연습 목록 | GET | /practices | 학습자 | mock (실제 코드 완료, 수동 테스트 대기) | #43 |
| 09 | 연습 상세 | GET | /practices/{id} | 학습자 | mock | #44 |
| 10 | 진행 저장·마침 | PUT | /practices/{id}/record | 학습자 | mock | #44 |
| 11 | 학습 기록 | GET | /records | 학습자 | mock | #45 |
| 12 | 쪽지 보내기 | POST | /threads | 학습자 | mock | #46 |
| 13 | 내 쪽지함 | GET | /threads | 학습자 | mock | #46 |
| 14 | 쪽지 상세 | GET | /threads/{id} | 학습자(본인), 이음쌤(담당) | mock | #48 |
| 15 | 이어쓰기·답장 | POST | /threads/{id}/messages | 학습자(본인), 이음쌤(담당) | mock | #48 |
| 16 | 이음쌤 요약 | GET | /teacher/summary | 이음쌤 | mock | #50 |
| 17 | 담당 학습자 목록 | GET | /teacher/students | 이음쌤 | mock | #50 |
| 18 | 담당 학습자 기록 | GET | /teacher/students/{id} | 이음쌤(담당) | mock | #50 |
| 19 | 받은 쪽지 목록 | GET | /teacher/threads | 이음쌤 | mock | #51 |
| 20 | 신호 목록 | GET | /teacher/signals | 이음쌤 | mock | #51 |
| 21 | 신호 대응 기록 | PATCH | /teacher/signals/{id} | 이음쌤(담당) | mock | #51 |
| 22 | 알림 목록 | GET | /notifications | 로그인(본인 것만) | mock | #49 |
| 23 | 알림 읽음 | PATCH | /notifications/{id}/read | 로그인(본인 것만) | mock | #49 |
| 24 | 알림 모두 읽음 | PATCH | /notifications/read-all | 로그인(본인 것만) | mock | #49 |

> 07·08은 `mock.learning.enabled=true`(기본)일 때 mock이고, `false`로 바꾸면 이미 만들어 둔 실제 코드가 응답한다. 학습 전체(07~11) 수동 테스트가 끝나면 `false`로 바꾸고 mock을 지운다.
> 아래 상세의 응답 예시는 기준서 그대로이고, mock이 실제로 내리는 값(ID·샘플)은 마지막 "mock 샘플 데이터"에 모았다.

## 인증·내 정보 (01~06)

### 01. 회원 가입 `POST /auth/signup` (S03, 공개)
**Request**
```json
{
  "role": "STUDENT",
  "loginId": "haneul01", "password": "pw12345678", "name": "김하늘", "nickname": "하늘",
  "birthDate": "2012-05-03", "phone": "01012345678", "email": null, "school": null,
  "agreeTerms": true, "agreePrivacy": true,
  "guardian": { "name": "김보호", "relation": "PARENT", "contact": "01098765432" }
}
```
**Response (201)**: `{ "status": "PENDING_GUARDIAN" }` (만 14세 이상이면 `"ACTIVE"`)

**규칙**
- `role`: `STUDENT` 또는 `TEACHER`.
- `loginId` 영문·숫자 4~20자(대소문자 구분 없이 중복 불가), `password` 8자 이상, `nickname` 1~20자(중복 허용), `phone` 숫자 10~11자리, `email`·`school`은 선택.
- `role=STUDENT`는 `birthDate` 필수. 가입일 기준 만 14세 미만이면 `guardian`(`relation`: PARENT, RELATIVE, FACILITY, OTHER)이 필수이고 `PENDING_GUARDIAN`으로 저장한다. 그 외에는 `guardian`을 무시하고 `ACTIVE`.
- **현재 구현은 이음쌤(`TEACHER`)도 `birthDate`가 필수다**(PR #55에서 기준서의 "선택"을 바꿈). 만 14세 미만 보호자 규칙은 학습자에게만 적용한다.
- `agreeTerms`·`agreePrivacy`가 모두 `true`여야 한다.

**에러**: 400 VALIDATION_FAILED, 409 LOGIN_ID_TAKEN

### 02. 로그인 `POST /auth/login` (S02, 공개)
**Request**: `{ "loginId": "haneul01", "password": "pw12345678" }`

**Response (200)**
```json
{ "token": "<JWT>", "expiresAt": "2026-11-11T10:30:00+09:00",
  "user": { "id": 12, "nickname": "하늘", "role": "STUDENT" } }
```
**규칙**: 토큰 유효 7일, 재발급 API 없음. `role`이 STUDENT면 S05(홈), TEACHER면 T01로 이동한다.

**에러**: 401 BAD_CREDENTIALS, 403 GUARDIAN_PENDING("보호자 확인이 끝나면 시작할 수 있어요.")

### 03. 내 정보 조회 `GET /me` (S14, 공통 헤더)
**Response (200)**
```json
{ "id": 12, "loginId": "haneul01", "nickname": "하늘", "email": null, "role": "STUDENT",
  "teacher": { "id": 2, "nickname": "푸른 이음쌤" } }
```
이음쌤이 아직 배정되지 않았거나 로그인한 사람이 이음쌤이면 `teacher`는 `null`. (기준서 예시의 `assignedAt` 대신 현재 구현은 `id`와 `nickname`을 내린다.)

### 04. 내 정보 수정 `PATCH /me` (S14)
**Request**: 보낸 필드만 바꾼다. `{ "nickname": "새닉네임", "email": "a@b.com" }` (`email`을 `""`로 보내면 삭제)
**Response (200)**: 03과 같다.
**에러**: 400 VALIDATION_FAILED

### 05. 비밀번호 변경 `PUT /me/password` (S14)
**Request**: `{ "currentPassword": "pw12345678", "newPassword": "newpw123456" }`
**Response**: 204
현재 비밀번호가 틀리면 401이 아니라 **400 VALIDATION_FAILED**(`fieldErrors`의 field가 `currentPassword`)다. 클라이언트가 401을 로그아웃으로 처리하기 때문이다.

### 06. 탈퇴 `POST /me/withdraw` (S14, 학습자만)
**Request**: 본문 없음. **Response**: 204
users 행을 지우면 학습 기록·쪽지·신호가 연쇄로 삭제된다. 이음쌤 계정은 403 FORBIDDEN.

## 학습 (07~11)
`content`와 `answers`의 JSON 형식은 아래 "content·answers 형식"을 본다.

### 07. 홈 `GET /home` (S05, 학습자만)
**Request**: 없음 (토큰의 사용자 기준)

**Response (200)**
```json
{
  "nickname": "하늘", "unreadMessages": 1, "doneTotal": 4,
  "resume": { "practiceId": 3, "title": "안전·자기 보호", "type": "UNIT", "area": "SAFETY", "level": 1, "estMinutes": 10, "status": "IN_PROGRESS" },
  "inProgress": [ { "practiceId": 4, "title": "안전·자기 보호", "area": "SAFETY", "level": 2 } ],
  "areas": [ { "area": "SAFETY", "doneCount": 1 }, { "area": "HELP", "doneCount": 1 }, { "area": "EMOTION", "doneCount": 2 } ],
  "recent": [ { "practiceId": 5, "title": "선생님께 처음 말 꺼내기", "area": "HELP", "completedAt": "2026-10-31T16:20:00+09:00" } ]
}
```
**규칙**
- `resume`: 하는 중인 연습 중 가장 최근 것. 없으면 아직 안 한 연습 중 (영역, 단계, 정렬 순서) 첫 번째이고 이때 `status`는 `NONE`. 모두 했으면 `null`.
- `inProgress`: 하는 중인 것 중 `resume`을 빼고 최대 2개.
- `recent`: 마친 날짜 최신 3개.
- `unreadMessages`: 읽지 않은 이음쌤 답장 수.
- `areas`는 SAFETY, HELP, EMOTION 순서로 항상 3개. `doneTotal`은 공개된 연습 중 마친 수.
- 공개(`published=1`)된 연습만 계산하고, 이음쌤 배정(`teacher_id`)과 관계없이 동작한다.

**에러**: 401 UNAUTHORIZED, 403 FORBIDDEN(이음쌤)

### 08. 연습 목록 `GET /practices?area=&level=&q=` (S06, 학습자만)
| 쿼리(모두 선택) | 설명 |
|---|---|
| area | `SAFETY`, `HELP`, `EMOTION` 중 하나 |
| level | 단계 숫자 |
| q | `title`·`summary` 부분 일치 (대소문자 무시) |

**Response (200)**
```json
{ "items": [
  { "id": 3, "type": "UNIT", "area": "SAFETY", "topic": "안전·자기 보호", "level": 1,
    "title": "...", "summary": "...", "estMinutes": 10, "myStatus": "NONE" }
] }
```
**규칙**: `myStatus`는 `NONE`(기록 없음), `IN_PROGRESS`, `DONE`. `published=1`만 내리고 정렬은 영역(SAFETY→HELP→EMOTION), 단계, `sort_order` 순. `content`는 포함하지 않는다. 조건에 맞는 연습이 없으면 `{"items":[]}`.

**에러**: 400 VALIDATION_FAILED(`area`가 목록 밖이거나 `level`이 숫자가 아님. `fieldErrors`의 `field`는 `area` 또는 `level`), 401, 403(이음쌤)

### 09. 연습 상세 `GET /practices/{id}` (S07·S08·S09, 학습자만)
S07·S08·S09가 열 때 한 번 부른다.
```json
{
  "id": 3, "type": "UNIT", "area": "SAFETY", "topic": "안전·자기 보호", "level": 1,
  "title": "...", "summary": "...", "estMinutes": 10,
  "content": { },
  "record": { "status": "IN_PROGRESS", "answers": { }, "myNote": null,
             "updatedAt": "2026-11-04T10:30:00+09:00", "completedAt": null }
}
```
기록이 없으면 `record`는 `null`. `published=0`이면 404 NOT_FOUND.

### 10. 진행 저장·마침 `PUT /practices/{id}/record` (S07·S08·S09, 학습자만)
진행 저장과 마침을 한 API로 한다. 응답은 200이고 09의 `record`와 같다.

**Request**
```json
{ "answers": { "choice": "c2", "feelings": ["f1"] }, "myNote": "내 일 같아서 더 알아보고 싶다", "done": false, "restart": false }
```
- `done:false`는 화면이 단계를 넘길 때마다 보내는 진행 저장("잠시 쉬기"에서 이어서 하기)이고 `status`는 `IN_PROGRESS`.
- `done:true`는 필수 선택을 검사한 뒤 `status=DONE`, `completedAt`=현재. UNIT은 사전 문항 전부·학습 카드 전부 읽음·사후 문항 전부, SCENARIO는 `choice` 1개, EMOTION은 단서와 마음 합쳐 1개 이상. 부족하면 400 RECORD_INCOMPLETE.
- `restart:true`는 `answers`·`myNote`를 비우고 `status=IN_PROGRESS`, `completedAt=null`로 되돌린다(다른 필드는 무시). DONE인 기록은 `restart`로만 되돌린다.
- `answers` 안의 id가 연습 `content`에 없으면 400 VALIDATION_FAILED. `myNote`는 SCENARIO에서만 저장하고(500자) 다른 유형에서는 무시한다.
- EMOTION의 `exclusive:true` 마음("잘 모르겠어요")은 다른 마음과 같이 고를 수 없고, 서버도 400 VALIDATION_FAILED로 막는다.

### 11. 학습 기록 `GET /records?status=&sort=` (S10, 학습자만)
`status`는 `DONE` 또는 `IN_PROGRESS`(생략=모두), `sort`는 `recent`(기본) 또는 `old`.
```json
{ "doneCount": 4, "inProgressCount": 1,
  "items": [ { "practiceId": 3, "title": "...", "type": "UNIT", "area": "SAFETY", "level": 1,
    "status": "DONE", "completedAt": "2026-10-29T15:00:00+09:00", "updatedAt": "2026-10-29T15:00:00+09:00",
    "compare": [ { "questionId": "q1", "text": "...", "then": "잘 모르겠어요", "now": "아니라고 말해요", "changed": true } ] } ] }
```
`compare`는 `type=UNIT`이고 사전·사후 답이 모두 있을 때만 채우고 그 외에는 `null`. `then`·`now`는 선택지 문구이고 점수는 계산하지 않는다.

## 쪽지 (12~15)

### 12. 쪽지 보내기 `POST /threads` (S11, 학습자만)
**Request**
```json
{ "topic": "ONLINE", "body": "게임에서 알게 된 사람이 사진을 보내 달래요", "practiceId": 8 }
```
**Response (201)**: `{ "id": 31, "status": "WAITING", "createdAt": "2026-11-04T10:30:00+09:00" }`

`topic`은 FRIEND(친구 관계), ONLINE(온라인에서 생긴 일), SCHOOL(학교생활), HOME(집과 일상), ETC(그 밖의 이야기). `body`는 1~500자이고 공백만은 안 된다. `practiceId`는 S08 시나리오에서 "이 상황이 내 일 같아요"로 넘어온 경우에만 보낸다.
서버는 한 트랜잭션에서 ① 담당 이음쌤 자동 배정(가장 적게 맡은 이음쌤, 한 명도 없으면 409 NO_TEACHER_AVAILABLE) ② 쪽지 묶음과 첫 메시지 저장 ③ 신호 검사를 한다. **신호 검사 결과는 응답에 넣지 않는다**(학습자에게 알리지 않는다는 화면 약속).

### 13. 내 쪽지함 `GET /threads?status=` (S12, 학습자만)
`status`는 `WAITING` 또는 `ANSWERED`(생략=모두), 정렬은 `lastMessageAt` 최신 순.
```json
{ "items": [ { "id": 31, "topic": "ONLINE", "status": "ANSWERED",
  "createdAt": "2026-11-04T10:30:00+09:00", "lastMessageAt": "2026-11-04T14:00:00+09:00",
  "preview": "게임에서 알게 된 사람이 사진을 보내 달래요", "unread": true,
  "linkedPractice": { "id": 8, "title": "온라인에서 받은 비밀 부탁" } } ] }
```
`preview`는 첫 쪽지의 앞 40자, `unread`는 이음쌤 메시지 중 안 읽은 것이 있는지, `linkedPractice`는 연결된 시나리오가 없으면 `null`.

### 14. 쪽지 상세 `GET /threads/{id}` (S12·T02, 학습자 본인·담당 이음쌤)
```json
{ "id": 31, "topic": "ONLINE", "status": "WAITING", "createdAt": "2026-11-04T10:30:00+09:00",
  "linkedPractice": { "id": 8, "title": "온라인에서 받은 비밀 부탁", "pickedChoice": "사진을 보내 줌" },
  "student": { "id": 12, "nickname": "하늘" },
  "teacher": { "nickname": "푸른 이음쌤" },
  "signal": { "id": 5, "status": "OPEN" },
  "messages": [ { "id": 101, "senderRole": "STUDENT", "body": "...", "createdAt": "2026-11-04T10:30:00+09:00" } ] }
```
학습자는 본인 쪽지, 이음쌤은 담당 쪽지만 볼 수 있다(아니면 403 FORBIDDEN). 호출한 사람의 반대편이 보낸 메시지의 읽음 시각을 채운다. **`signal`은 이음쌤이 부를 때만 내리고 학습자 응답에는 키 자체가 없다.** `my_note`는 어느 경우에도 내리지 않는다.

### 15. 이어쓰기·답장 `POST /threads/{id}/messages` (S12·T02, 학습자 본인·담당 이음쌤)
**Request**: `{ "body": "이야기해 줘서 고마워요. 지금 어떤 마음이에요?" }` (1~500자)
**Response (201)**: `{ "id": 102, "senderRole": "TEACHER", "body": "...", "createdAt": "2026-11-04T14:00:00+09:00" }`
학습자가 보내면 `status=WAITING`으로 바뀌고 신호 검사를 한다. 이음쌤이 보내면 `ANSWERED`. 접근 규칙은 14와 같다.

## 이음쌤 (16~21)
모두 role=TEACHER만 호출할 수 있고, 담당 학습자의 데이터만 내린다. 응답에 점수와 신호 등급을 넣지 않는다.

### 16. 요약 `GET /teacher/summary` (헤더 배지, T01)
```json
{ "studentCount": 5, "waitingThreadCount": 2, "openSignalCount": 1 }
```

### 17. 담당 학습자 목록 `GET /teacher/students?q=&sort=` (T01)
`q`는 닉네임 부분 일치, `sort`는 `nickname`(기본), `assigned`(최근 배정 먼저), `recent`(최근 활동 먼저).
```json
{ "items": [ { "id": 12, "nickname": "하늘", "assignedAt": "2026-11-04T10:30:00+09:00",
  "lastActivityAt": "2026-11-04T14:00:00+09:00", "doneCount": 4, "waitingThreadCount": 1, "hasOpenSignal": true } ] }
```
`lastActivityAt`은 기록 갱신 시각과 쪽지 시각 중 늦은 것(없으면 `null`), `doneCount`는 DONE 기록 수.

### 18. 담당 학습자 기록 `GET /teacher/students/{id}` (T01 오른쪽 패널)
```json
{ "id": 12, "nickname": "하늘", "assignedAt": "2026-11-04T10:30:00+09:00", "hasOpenSignal": true, "doneCount": 4,
  "records": [
    { "practiceId": 3, "title": "...", "type": "UNIT", "area": "SAFETY", "level": 1,
      "completedAt": "2026-10-29T15:00:00+09:00", "compare": [ ], "emotion": null },
    { "practiceId": 9, "title": "...", "type": "EMOTION", "area": "EMOTION", "level": 1,
      "completedAt": "2026-10-27T11:00:00+09:00", "compare": null,
      "emotion": { "clues": ["시선이 아래로 향해요"], "feelings": ["서운해요"] } } ],
  "threads": [ { "id": 31, "topic": "ONLINE", "status": "WAITING", "createdAt": "2026-11-04T10:30:00+09:00" } ] }
```
`records`는 DONE만. `compare`는 UNIT에만(형식은 11과 같다), `emotion`은 EMOTION에만 채운다. SCENARIO는 제목과 마친 날짜만 내리고 `answers`·`my_note`는 내리지 않는다. 담당 학습자가 아니면 403 FORBIDDEN.

### 19. 받은 쪽지 목록 `GET /teacher/threads?status=` (T02)
`status`는 `WAITING` 또는 `ANSWERED`(생략=모두), `lastMessageAt` 최신 순.
```json
{ "items": [ { "id": 31, "student": { "id": 12, "nickname": "하늘" }, "topic": "ONLINE", "status": "WAITING",
  "lastMessageAt": "2026-11-04T10:30:00+09:00", "preview": "...", "linkedPractice": null, "hasSignal": true } ] }
```

### 20. 신호 목록 `GET /teacher/signals?status=` (T03)
`status`는 `OPEN`("아직 안 했어요") 또는 `HANDLED`("했어요"), 생략=모두. 정렬은 OPEN 먼저, 같은 상태에서 CRITICAL 먼저, 최신 순.
```json
{ "items": [ { "id": 5, "status": "OPEN", "matchedText": "죽고 싶다",
  "student": { "id": 12, "nickname": "하늘", "assignedAt": "2026-11-04T10:30:00+09:00" },
  "message": { "id": 101, "threadId": 31, "body": "...", "createdAt": "2026-11-04T10:30:00+09:00" },
  "handledAt": null, "responseMemo": null, "createdAt": "2026-11-04T10:30:00+09:00" } ] }
```

### 21. 신호 대응 기록 `PATCH /teacher/signals/{id}` (T03)
**Request**: `{ "handled": true, "memo": "다음 날 담임과 통화했고 1388을 안내했다" }`
**Response (200)**: 20의 항목 1개.
`handled:true`면 `status=HANDLED`, `handledAt`=현재. `false`면 OPEN으로 되돌리고 `handledAt=null`. `memo`는 500자 이하이고 생략하면 그대로 두며 학습자에게는 절대 보이지 않는다. 담당 학습자의 신호가 아니면 403 FORBIDDEN.

## 알림 (22~24)
학습자와 이음쌤이 같은 API를 쓰고, 서버는 토큰의 사용자 id로 본인 알림만 내려준다.

### 22. 알림 목록 `GET /notifications?unread=` (S15, 사이드 메뉴 배지)
`unread=true`면 안 읽은 것만, 생략하면 전체를 최신순으로 최대 50건. 배지 숫자는 `unreadCount`로 그린다.
```json
{ "unreadCount": 3,
  "items": [ { "id": 41, "type": "REPLY_ARRIVED", "title": "이음쌤의 답장이 도착했어요", "body": "쪽지함에서 확인해 보세요",
               "linkType": "THREAD", "linkId": 7, "isRead": false, "createdAt": "2026-11-02T09:12:00+09:00" } ] }
```
`type`은 NOTE_RECEIVED, SIGNAL_FLAGGED, LEARNER_ASSIGNED, REPLY_ARRIVED, NOTE_READ, TEACHER_ASSIGNED. `linkType`은 THREAD, SIGNAL, PROFILE, STUDENT이고 이동할 곳이 없으면 `linkId`는 `null`. 제목·본문은 서버가 정한 고정 문구뿐이고 쪽지 내용·찾은 낱말은 넣지 않는다.

### 23. 알림 읽음 `PATCH /notifications/{id}/read` (S15)
**Response**: 204. 이미 읽은 알림이면 아무것도 바꾸지 않는다. 다른 사람의 알림이거나 없는 id면 404 NOT_FOUND.

### 24. 알림 모두 읽음 `PATCH /notifications/read-all` (S15)
**Response (200)**: `{ "updated": 3 }` (바뀐 개수)

## content·answers 형식
`practices.type`마다 다르다.

```jsonc
// UNIT — content            // answers (cardsRead는 1부터 세는 카드 번호)
{ "questions": [ { "id": "q1", "text": "...",
    "options": [ { "id": "a", "label": "..." }, { "id": "c", "label": "잘 모르겠어요" } ],
    "compare": { "title": "...", "best": "b", "reason": "..." } } ],
  "cards": [ { "title": "...", "l1": "...", "l2": "..." } ] }
{ "pre": { "q1": "c" }, "cardsRead": [1, 2, 3, 4, 5], "post": { "q1": "b" } }

// SCENARIO — content        // answers ("나에게 한 줄"은 myNote)
{ "scene": "...", "situation": "...",
  "choices": [ { "id": "c1", "text": "...", "follow": "...", "hear": "..." } ],
  "remember": [ "..." ], "feelings": [ { "id": "f1", "label": "불안해요" } ] }
{ "choice": "c1", "feelings": ["f1"] }

// EMOTION — content         // answers
{ "scene": "...", "situation": "...",
  "clues": [ { "id": "k1", "label": "..." } ],
  "feelings": [ { "id": "f1", "label": "..." }, { "id": "f9", "label": "잘 모르겠어요", "exclusive": true } ],
  "keyClue": "...", "askLine": "..." }
{ "clues": ["k1"], "feelings": ["f1"] }
```

## mock 샘플 데이터
mock(07~24)은 아래 고정값으로 응답하고, **아무것도 저장하지 않는다**(같은 요청에는 항상 같은 응답). 연습 content는 `db/V3__seed_practices.sql` 시드와 같은 내용이다.

| 대상 | 값 |
|---|---|
| 연습 id | 1 UNIT·SAFETY(마침), 2 SCENARIO·HELP(하는 중), 3 EMOTION·EMOTION(시작 전) |
| 쪽지 id | 31(ONLINE, ANSWERED, 안 읽은 답장 있음), 32(SCHOOL, WAITING) |
| 이음쌤 화면의 학습자 id | 12 하늘(18번 기록 있음), 13 바다 |
| 신호 id | 5 OPEN, 6 HANDLED |
| 알림 id | 41~44 (안 읽음 3개, 읽음 1개) |

- 위 id 밖의 값을 부르면 404 NOT_FOUND다.
- 18번은 id 12만, 21번은 id 5·6만 응답한다.
- 14번 mock은 이음쌤이 부를 때만 `signal`을 내리고, 15번 mock의 `senderRole`은 호출한 사람의 역할이다.

## 임의로 추가한 명세
기준서에 없어서 mock을 만들며 정한 내용이다. 기준서에 있는 내용은 바꾸지 않았다. 실제 구현 때 기준서와 다르면 기준서를 따른다.

| 항목 | 기준서에 없어서 임의로 정한 내용 | 이유 |
|---|---|---|
| 샘플 값 | mock 본문 값(제목·문구·선택지)은 샘플이다. 필드 구조는 기준서와 같다. | 화면을 그리려면 값이 필요하다. |
| 404 | 위 샘플 id 밖의 id는 `NOT_FOUND`다(09, 14, 15, 18, 21, 23). | 프론트가 404 화면을 확인할 수 있다. |
| 10번 | `done:true`인데 `answers`가 비어 있으면 `RECORD_INCOMPLETE`. `myNote`는 id 2(SCENARIO)에서만 저장, 500자 초과는 `VALIDATION_FAILED`. | 마침 버튼의 오류 흐름을 확인하게 한다. |
| 12·15번 | `body`가 공백이거나 500자를 넘으면 `VALIDATION_FAILED`(field=`body`). 12번은 `topic`이 5개 값 밖이어도 `VALIDATION_FAILED`(field=`topic`). | 기준서의 `body`·`topic` 규칙을 mock에도 적용한다. |
| 쿼리 값 | `status`·`sort`·`area`·`level`·`unread`가 허용 값 밖이면 `VALIDATION_FAILED`. | 기준서에 값 목록만 있고 잘못된 값의 처리가 없다. |
| 21번 | `handled`가 없으면 `VALIDATION_FAILED`(field=`handled`), `memo` 500자 초과도 `VALIDATION_FAILED`. | 기준서의 `memo` 규칙을 mock에도 적용한다. |
| 22번 시간 | `createdAt`에 `+09:00`을 붙인다. 기준서 예시는 붙어 있지 않지만 공통 시간 규약을 따른다. | 다른 API와 시간 형식을 맞춘다. |
| 역할 검사 | 학습자 전용 API(07~13)를 이음쌤이 부르면 `FORBIDDEN`. 이음쌤 경로 `/teacher/**`는 학습자가 부르면 보안 설정이 `FORBIDDEN`. | 기준서의 호출 권한 표를 그대로 지키게 한다. |
| 500 오류 | 별도 코드를 만들지 않았다. 기준서에 없다. | 필요해지면 `INTERNAL_ERROR` 추가를 팀과 정한다. |
