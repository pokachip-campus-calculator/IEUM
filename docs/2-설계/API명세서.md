# API 명세서

> 기준은 `이음 MVP 개발 기준서` 3장(공유 아티팩트 정본)입니다. 이 문서는 그 내용을 옮긴 것이고, 2026-11-11 기준 develop 코드와 맞춰 두었습니다.
> 학습자 화면 14개·공용 알림 화면 1개·이음쌤 화면 3개가 API 24개로 모두 동작합니다. 학습자·이음쌤이 같이 쓰는 API(03–05, 14, 15, 22–24)는 한 번만 정의합니다.

## 공통 규약

| 항목 | 규약 |
| --- | --- |
| 기본 경로 | `/api/v1`, JSON(UTF-8) |
| 인증 | `Authorization: Bearer <JWT>`. 가입·로그인만 공개. /teacher/**는 role=TEACHER만 호출할 수 있다. 토큰은 로그인한 지 1시간 뒤에 만료된다. |
| 시간 | ISO-8601 한국 시간, 예: `2026-11-04T10:30:00+09:00` |
| 성공 응답 | 본문을 그대로 내린다(봉투 없음). 생성은 201, 본문 없는 성공은 204. |
| 오류 응답 | `{"code":"LOGIN_ID_TAKEN","message":"이미 사용 중인 아이디입니다.","fieldErrors":[{"field":"loginId","message":"..."}]}` — `message`는 화면에 그대로 보여주는 문장이다. |
| 목록 | 영역·기록·쪽지 등 데이터가 적어 페이지네이션 없이 `{"items":[...]}` 한 번에 내린다. |
| 다시 하기 | 학습자×연습당 기록 1행. 다시 하면 답과 나에게 한 줄만 비우고 진행 중으로 되돌린다. completed_at은 지우지 않아 “완료한 적 있다”는 표시로 남는다. |

## 오류 코드

| code | HTTP | 언제 | message |
| --- | --- | --- | --- |
| `VALIDATION_FAILED` | 400 | 입력 형식 오류 (`fieldErrors` 포함) | 입력 형식이 올바르지 않습니다. |
| `RECORD_INCOMPLETE` | 400 | `done:true`인데 필수 선택이 빠짐 | 필수 선택이 빠졌습니다. |
| `UNAUTHORIZED` | 401 | 토큰이 없거나 만료됨, 탈퇴한 계정의 토큰 | 유효하지 않은 토큰입니다. |
| `BAD_CREDENTIALS` | 401 | 아이디·비밀번호가 맞지 않음 | 아이디 또는 비밀번호가 맞지 않습니다. |
| `GUARDIAN_PENDING` | 403 | 만 14세 미만 계정의 보호자 확인 전 로그인 | 보호자 확인이 끝나면 시작할 수 있습니다. |
| `FORBIDDEN` | 403 | 다른 사람의 자원이거나 역할이 맞지 않음 | 권한이 없습니다. |
| `TEACHER_SIGNUP_CLOSED` | 403 | 이음쌤으로 가입을 시도함(01) | 이음쌤은 기관 확인을 거친 분만 가입할 수 있어요. 가입 문의는 운영 포카칩(https://github.com/pokachip-campus-calculator/IEUM)으로 연락해 주세요. |
| `NOT_FOUND` | 404 | 없는 id (없는 주소 포함) | 요청한 정보를 찾을 수 없습니다. |
| `METHOD_NOT_ALLOWED` | 405 | 주소는 맞지만 허용하지 않는 요청 방식 | 지원하지 않는 요청 방식입니다. |
| `LOGIN_ID_TAKEN` | 409 | 가입 아이디 중복 | 이미 사용 중인 아이디입니다. |
| `NO_TEACHER_AVAILABLE` | 409 | 쪽지를 맡을 활성 이음쌤이 없음 | 배정된 이음쌤이 없습니다. |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 (원인은 응답에 넣지 않는다) | 서버에 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요. |

표에 없는 오류도 같은 형식으로 내립니다. 주소의 id 자리에 숫자가 아닌 값이 오면(예: /threads/abc) `VALIDATION_FAILED` 400이고 `fieldErrors`에 항목 이름이 들어갑니다. 필수 파라미터 누락·지원하지 않는 본문 형식(415) 같은 그 밖의 4xx는 상태 코드를 그대로 두고 `code`만 `VALIDATION_FAILED`로 내립니다.

`status`·`sort`·`area`·`level`·`unread` 같은 조회 조건이 허용 값 밖이면 `VALIDATION_FAILED`(`fieldErrors`에 그 조건 이름)이고, 학습자 전용 API(07–13)를 이음쌤이 부르면 `FORBIDDEN`입니다.

## API 목록

| # | 메서드·경로 | 호출할 수 있는 사람 | 쓰는 화면 | 다루는 테이블 |
| --- | --- | --- | --- | --- |
| 01 | `POST /auth/signup` | 공개 | S03 | users |
| 02 | `POST /auth/login` | 공개 | S02 | users |
| 03 | `GET /me` | 로그인 | S14, 공통 헤더 | users |
| 04 | `PATCH /me` | 로그인 | S14 | users |
| 05 | `PUT /me/password` | 로그인 | S14 | users |
| 06 | `POST /me/withdraw` | 학습자 | S14 | users (연쇄 삭제) |
| 07 | `GET /home` | 학습자 | S05 | practices, practice_records, messages |
| 08 | `GET /practices` | 학습자 | S06 | practices, practice_records |
| 09 | `GET /practices/{id}` | 학습자 | S07, S08, S09 | practices, practice_records |
| 10 | `PUT /practices/{id}/record` | 학습자 | S07, S08, S09 | practice_records |
| 11 | `GET /records` | 학습자 | S10 | practice_records, practices |
| 12 | `POST /threads` | 학습자 | S11 | message_threads, messages, signal_events, users |
| 13 | `GET /threads` | 학습자 | S12 | message_threads, messages |
| 14 | `GET /threads/{id}` | 학습자(본인), 이음쌤(담당) | S12, T02 | message_threads, messages |
| 15 | `POST /threads/{id}/messages` | 학습자(본인), 이음쌤(담당) | S12, T02 | messages, message_threads, signal_events |
| 16 | `GET /teacher/summary` | 이음쌤 | T01~T03 헤더 배지 | users, message_threads, signal_events |
| 17 | `GET /teacher/students` | 이음쌤 | T01 | users, practice_records, signal_events |
| 18 | `GET /teacher/students/{id}` | 이음쌤(담당) | T01 | users, practice_records, message_threads |
| 19 | `GET /teacher/threads` | 이음쌤 | T02 | message_threads, messages, signal_events |
| 20 | `GET /teacher/signals` | 이음쌤 | T03 | signal_events, messages |
| 21 | `PATCH /teacher/signals/{id}` | 이음쌤(담당) | T03 | signal_events |
| 22 | GET /notifications?unread= | 학습자, 이음쌤(본인 것만) | S15, 사이드 메뉴 배지 | notifications |
| 23 | PATCH /notifications/{id}/read | 학습자, 이음쌤(본인 것만) | S15 | notifications |
| 24 | PATCH /notifications/read-all | 학습자, 이음쌤(본인 것만) | S15 | notifications |

## 인증·내 정보 (01–06)

**01 `POST /auth/signup`** — 학습자 가입(이음쌤은 가입으로 만들지 않는다). 요청에 role(STUDENT, 필수)을 넣는다. 응답은 201.

```json
// 요청
{
  "role": "STUDENT",   // role은 필수(생략하면 VALIDATION_FAILED), "TEACHER"는 403 TEACHER_SIGNUP_CLOSED
  "loginId": "haneul01", "password": "pw12345678", "name": "김하늘", "nickname": "하늘",
  "birthDate": "2012-05-03", "phone": "01012345678", "email": null, "school": null,
  "agreeTerms": true, "agreePrivacy": true,
  "guardian": { "name": "김보호", "relation": "PARENT", "contact": "01098765432" }
}
// 응답
{ "status": "PENDING_GUARDIAN" }   // 만 14세 이상이면 "ACTIVE"
```

규칙: `loginId` 영문·숫자 4~20자(대소문자 구분 없이 중복 불가), `password` 8자 이상, `nickname` 1~20자(중복 허용), `phone` 숫자 10~11자리, `email`·`school`은 선택. role=TEACHER이면 가입을 거부하고(403 TEACHER_SIGNUP_CLOSED, users에 행을 만들지 않는다) 이음쌤 계정은 기관 확인 뒤 db/ops.sql의 INSERT로 직접 넣는다. role=STUDENT는 birthDate가 필수(비어 있으면 VALIDATION_FAILED)이며 가입일 기준 만 14세 미만이면 `guardian`(relation: PARENT, RELATIVE, FACILITY, OTHER)이 필수이고 status=PENDING_GUARDIAN으로 저장한다. 그 외에는 `guardian`을 무시하고 ACTIVE로 저장한다. `agreeTerms`·`agreePrivacy`가 모두 true여야 하고 `terms_agreed_at`에 기록한다. 입력 상한은 password 72자, name 필수·30자, nickname 공백만 불가, email 100자, school 50자, 보호자 name 30자·contact 100자이다. 오류: `VALIDATION_FAILED`, `LOGIN_ID_TAKEN`.

**02 `POST /auth/login`** — 학습자·이음쌤 공통.

```json
// 요청
{ "loginId": "haneul01", "password": "pw12345678" }
// 응답 200
{ "token": "<JWT>", "expiresAt": "2026-11-11T10:30:00+09:00",
  "user": { "id": 12, "nickname": "하늘", "role": "STUDENT" } }
```

규칙: 토큰 유효 1시간(로그인한 시각부터. 설정 jwt.expiration-minutes=60), last_login_at 갱신. 1시간이 지나면 401 UNAUTHORIZED가 오고, 클라이언트는 토큰을 지우고 로그인 화면으로 보내며 "시간이 지나 다시 로그인해 주세요" 안내를 보여 준다. role이 STUDENT면 S05, TEACHER면 T01로 이동한다. 오류: `BAD_CREDENTIALS`, `GUARDIAN_PENDING`(“보호자 확인이 끝나면 시작할 수 있습니다.”).

**03 `GET /me`** — 헤더·내 정보 화면이 쓴다.

```json
{ "id": 12, "loginId": "haneul01", "nickname": "하늘", "email": null, "role": "STUDENT",
  "teacher": { "id": 5, "nickname": "푸른 이음쌤" } }
```

이음쌤이 아직 배정되지 않았거나 로그인한 사람이 이음쌤이면 `teacher`는 `null`.

**04 `PATCH /me`** — 보낸 필드만 바꾼다. 응답은 03과 같다.

```json
{ "nickname": "새닉네임", "email": "a@b.com" }   // email을 ""으로 보내면 삭제
```

**05 `PUT /me/password`** — 응답 204.

```json
{ "currentPassword": "pw12345678", "newPassword": "newpw123456" }
```

현재 비밀번호가 틀리면 401 대신 `VALIDATION_FAILED`(fieldErrors에 `currentPassword`)를 내린다. 클라이언트가 401을 로그아웃으로 처리하기 때문이다.

**06 `POST /me/withdraw`** — 학습자만. 응답 204.

```json
{ "acknowledged": true }
```

`users` 행을 지우면 학습 기록·쪽지·신호가 연쇄로 삭제된다. 요청 본문의 acknowledged가 true가 아니거나 본문이 없으면 VALIDATION_FAILED(fieldErrors에 acknowledged)이다. 이음쌤 계정은 `FORBIDDEN`.

## 학습 (07–11)

`content`와 `answers`의 JSON 형식은 이 문서 아래의 “content_json·answers_json 형식”에 있습니다.

**07 `GET /home`** — S05 한 화면 분량.

```json
{
  "nickname": "하늘", "unreadMessages": 1, "doneTotal": 4,
  "resume": { "practiceId": 3, "title": "안전·자기 보호", "type": "UNIT", "area": "SAFETY", "level": 1, "estMinutes": 10, "myStatus": "IN_PROGRESS" },
  "inProgress": [ { "practiceId": 4, "title": "안전·자기 보호", "area": "SAFETY", "level": 2 } ],
  "areas": [ { "area": "SAFETY", "doneCount": 1 }, { "area": "HELP", "doneCount": 1 }, { "area": "EMOTION", "doneCount": 2 } ],
  "recent": [ { "practiceId": 5, "title": "선생님께 처음 말 꺼내기", "area": "HELP", "completedAt": "2026-10-31T16:20:00+09:00" } ]
}
```

규칙: `resume`은 하는 중인 연습 중 가장 최근 것, 없으면 아직 안 한 연습 중 (영역, 단계, 정렬 순서) 첫 번째, 모두 했으면 `null`. `inProgress`는 하는 중인 것 중 `resume`을 빼고 최대 2개. `recent`는 completed_at이 있는 연습 중 마친 날짜 최신 3개(다시 하는 중이어도 포함). `unreadMessages`는 읽지 않은 이음쌤 답장 수. resume의 상태 이름은 08 목록과 같은 myStatus이고 값은 NONE·IN_PROGRESS·DONE이다. 안 한 연습이 resume이 되면 NONE이다.

**08 `GET /practices?area=&level=&q=`** — S06 목록. 세 조건은 모두 선택이고 `area`는 SAFETY, HELP, EMOTION.

```json
{ "items": [
  { "id": 3, "type": "UNIT", "area": "SAFETY", "topic": "안전·자기 보호", "level": 1,
    "title": "...", "summary": "...", "estMinutes": 10, "myStatus": "NONE" }
] }
```

`myStatus`는 NONE, IN_PROGRESS, DONE이고, completedAt이 있으면 다시 하는 중이어도 완료한 적 있는 연습이다(도장 표시용). `q`는 `title`·`summary` 부분 일치(대소문자 무시). `published=1`만 내리고 정렬은 영역, 단계, `sort_order`. `content`는 포함하지 않는다. 각 항목에는 마친 시각 completedAt(없으면 null)도 담긴다.

**09 `GET /practices/{id}`** — S07·S08·S09가 열 때 한 번 부른다.

```json
{
  "id": 3, "type": "UNIT", "area": "SAFETY", "topic": "안전·자기 보호", "level": 1,
  "title": "...", "summary": "...", "estMinutes": 10,
  "content": { },
  "record": { "status": "IN_PROGRESS", "answers": { }, "myNote": null,
             "updatedAt": "2026-11-04T10:30:00+09:00", "completedAt": null }
}
```

기록이 없으면 `record`는 `null`. `published=0`이면 `NOT_FOUND`.

**10 `PUT /practices/{id}/record`** — 진행 저장과 마침을 한 API로 한다. 응답은 200, 09의 `record`와 같다.

```json
{ "answers": { "choice": "c2", "feelings": ["f1"] }, "myNote": "내 일 같아서 더 알아보고 싶다", "done": false, "restart": false }
```

- `done:false`는 화면이 단계를 넘길 때마다 보내는 진행 저장(“잠시 쉬기”에서 이어서 하기)이고, status는 IN_PROGRESS.
- `done:true`는 필수 선택을 검사한 뒤 status=DONE, `completed_at`=현재(다시 마칠 때도 현재로 갱신). UNIT은 사전 문항 전부·학습 카드 전부 읽음·사후 문항 전부, SCENARIO는 `choice` 1개, EMOTION은 단서와 마음 합쳐 1개 이상. 부족하면 `RECORD_INCOMPLETE`.
- `restart:true`는 `answers`·`my_note`를 비우고 status=IN_PROGRESS, `completed_at`은 지우지 않는다(다른 필드는 무시). completed_at이 있으면 “완료한 적 있다”는 뜻이라 도장과 내 기록에 평생 남는다. DONE인 기록은 `restart`로만 되돌린다.
- `answers` 안의 id가 연습 `content`에 없으면 `VALIDATION_FAILED`. `myNote`는 SCENARIO에서만 저장하고(500자) 다른 유형에서는 무시한다. answers의 키는 유형별로 정해진 것만 받고(UNIT은 pre·cardsRead·post, SCENARIO는 choice·feelings, EMOTION은 clues·feelings) 그 밖의 키는 VALIDATION_FAILED이다. UNIT의 문항·선택지 id와 cardsRead 번호(1부터 카드 수까지)도 content에 있는 것만 받는다. EMOTION에서 exclusive인 마음은 다른 마음과 함께 고를 수 없다(VALIDATION_FAILED).

동시 저장: 같은 연습의 첫 저장이 동시에 두 번 오면 `(user_id, practice_id)` 유니크 키 충돌이 나는데, 서버가 한 번 다시 처리해 먼저 저장된 기록에 이번 요청을 덮어쓰고 200으로 응답한다(500이 아니다). 요청·응답 형식은 그대로다.

**11 `GET /records?status=&sort=`** — S10. `status`는 DONE 또는 IN_PROGRESS(생략=모두), `sort`는 `recent`(기본) 또는 `old`. DONE은 completed_at이 있는 기록이라 다시 하는 중인 연습도 남고, 그 연습은 IN_PROGRESS에도 함께 나온다.

```json
{ "doneCount": 4, "inProgressCount": 1,
  "items": [ { "practiceId": 3, "title": "...", "type": "UNIT", "area": "SAFETY", "level": 1,
    "status": "DONE", "completedAt": "2026-10-29T15:00:00+09:00", "updatedAt": "2026-10-29T15:00:00+09:00",
    "compare": [ { "questionId": "q1", "text": "...", "then": "잘 모르겠어요", "now": "아니라고 말해요", "changed": true } ] } ] }
```

`compare`는 type=UNIT이고 사전·사후 답이 모두 있을 때만 채우고 그 외에는 `null`. `then`·`now`는 선택지 문구이고 점수는 계산하지 않는다.

## 쪽지 (12–15)

**12 `POST /threads`** — 새 쪽지 쓰기(S11). 응답은 201.

```json
// 요청
{ "topic": "ONLINE", "body": "게임에서 알게 된 사람이 사진을 보내 달래요", "practiceId": 8 }
// 응답
{ "id": 31, "status": "WAITING", "createdAt": "2026-11-04T10:30:00+09:00" }
```

`topic`은 FRIEND(친구 관계), ONLINE(온라인에서 생긴 일), SCHOOL(학교생활), HOME(집과 일상), ETC(그 밖의 이야기). `body`는 1~500자이고 공백만은 안 된다. `practiceId`는 S08 시나리오에서 “이 상황이 내 일 같아요”로 넘어온 경우에만 보낸다(없는 연습 id는 VALIDATION_FAILED). 한 트랜잭션에서 다음 세 가지를 한다.

1. `users.teacher_id`가 비어 있으면 지금 맡고 있는 학습자가 가장 적은 이음쌤(role=TEACHER, 동률이면 id가 작은 쪽)에게 배정하고 `teacher_assigned_at`을 기록한다. 이음쌤이 한 명도 없으면 `NO_TEACHER_AVAILABLE`.
2. `message_threads`(status=WAITING)와 첫 `messages` 행을 저장한다.
3. 신호 검사를 한다(아래 규칙). 결과는 응답에 넣지 않는다. 학습자에게 알리지 않는다는 화면 약속이다.

신호 검사 규칙: 학습자가 보낸 메시지를 저장할 때마다 본문과 `signal_keywords`(`active=1`, `match_type='WORD'`)의 `normalized`를 같은 방식으로 정규화(소문자로 바꾸고 한글·영문·숫자만 남김)해 포함 여부를 본다. 일치하는 낱말이 있으면 CRITICAL을 우선하고 같은 등급이면 id가 작은 하나로 `signal_events` 1행(`UNIQUE(message_id)`)을 만든다.

**13 `GET /threads?status=`** — 내 쪽지함 목록(S12). `status`는 WAITING 또는 ANSWERED(생략=모두), 정렬은 `lastMessageAt` 최신 순.

```json
{ "items": [ { "id": 31, "topic": "ONLINE", "status": "ANSWERED",
  "createdAt": "2026-11-04T10:30:00+09:00", "lastMessageAt": "2026-11-04T14:00:00+09:00",
  "preview": "게임에서 알게 된 사람이 사진을 보내 달래요", "unread": true,
  "linkedPractice": { "id": 8, "title": "온라인에서 받은 비밀 부탁" } } ] }
```

`preview`는 첫 쪽지의 앞 40자, `unread`는 이음쌤 메시지 중 `read_at`이 비어 있는 것이 있는지, `linkedPractice`는 연결된 시나리오가 없으면 `null`.

**14 `GET /threads/{id}`** — 쪽지 하나와 메시지 전체(S12, T02).

```json
{ "id": 31, "topic": "ONLINE", "status": "WAITING", "createdAt": "2026-11-04T10:30:00+09:00",
  "linkedPractice": { "id": 8, "title": "온라인에서 받은 비밀 부탁", "pickedChoice": "사진을 보내 줌" },
  "student": { "id": 12, "nickname": "하늘" },
  "teacher": { "nickname": "푸른 이음쌤" },
  "signal": { "id": 5, "status": "OPEN" },
  "messages": [ { "id": 101, "senderRole": "STUDENT", "body": "...", "createdAt": "2026-11-04T10:30:00+09:00" } ] }
```

학습자는 본인 쪽지, 이음쌤은 `teacher_id`가 본인인 쪽지만 볼 수 있다(아니면 `FORBIDDEN`). 호출한 사람의 반대편이 보낸 메시지의 `read_at`을 현재 시각으로 채운다. `pickedChoice`는 연결된 SCENARIO에서 그 학습자가 고른 선택지 문구이고, `signal`은 이음쌤이 부를 때만 내린다(학습자에게는 키 자체가 없다). `my_note`는 어느 경우에도 내리지 않는다.

**15 `POST /threads/{id}/messages`** — 이어서 쓰기·답장. 응답은 201.

```json
// 요청
{ "body": "이야기해 줘서 고마워요. 지금 어떤 마음이에요?" }
// 응답
{ "id": 102, "senderRole": "TEACHER", "body": "...", "createdAt": "2026-11-04T14:00:00+09:00" }
```

`body`는 1~500자. 학습자가 보내면 `status=WAITING`으로 바뀌고 신호 검사를 한다. 이음쌤이 보내면 `ANSWERED`로 바뀐다. `last_message_at`을 갱신하고 접근 규칙은 14와 같다.

## 이음쌤 (16–21)

모두 role=TEACHER만 호출할 수 있고, `teacher_id`가 본인인 학습자의 데이터만 내린다. 화면이 “점수·순위·위험도 해석 없이”라고 약속하므로 응답에 점수와 신호 등급을 넣지 않는다(등급은 정렬에만 쓴다).

**16 `GET /teacher/summary`** — 헤더 배지와 T01 상단 숫자.

```json
{ "studentCount": 5, "waitingThreadCount": 2, "openSignalCount": 1 }
```

**17 `GET /teacher/students?q=&sort=`** — T01 목록. `q`는 닉네임 부분 일치, `sort`는 `nickname`(기본), `assigned`(최근 배정 먼저), `recent`(최근 활동 먼저, 활동이 없는 학습자는 맨 뒤).

```json
{ "items": [ { "id": 12, "nickname": "하늘", "assignedAt": "2026-11-04T10:30:00+09:00",
  "lastActivityAt": "2026-11-04T14:00:00+09:00", "doneCount": 4, "waitingThreadCount": 1, "hasOpenSignal": true } ] }
```

`lastActivityAt`은 그 학습자의 기록 갱신 시각과 쪽지 시각 중 늦은 것(없으면 `null`), `doneCount`는 completed_at이 있는 기록 수(다시 하는 중인 것 포함).

**18 `GET /teacher/students/{id}`** — T01 오른쪽 기록 패널.

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

`records`는 completed_at이 있는 기록만(다시 하는 중이어도 포함). `compare`는 UNIT에만(형식은 11과 같다), `emotion`은 EMOTION에만 채운다. SCENARIO는 제목과 마친 날짜만 내리고 `answers`·`my_note`는 내리지 않는다. 담당 학습자가 아니면 `FORBIDDEN`.

**19 `GET /teacher/threads?status=`** — T02 목록. `status`는 WAITING 또는 ANSWERED(생략=모두), `lastMessageAt` 최신 순.

```json
{ "items": [ { "id": 31, "student": { "id": 12, "nickname": "하늘" }, "topic": "ONLINE", "status": "WAITING",
  "lastMessageAt": "2026-11-04T10:30:00+09:00", "preview": "...", "linkedPractice": null, "hasSignal": true, "signalStatus": "OPEN" } ] }
```

`hasSignal`은 그 쪽지에 신호가 하나라도 붙어 있으면 true입니다(처리 완료여도 true). `signalStatus`는 신호가 있을 때만 값이 있습니다. 처리 안 한(OPEN) 신호가 하나라도 있으면 `OPEN`(“확인이 필요한 신호가 있어요”), 신호가 있고 전부 처리됐으면 `HANDLED`(“신호를 확인했어요”), 신호가 없으면 `hasSignal:false`이고 `signalStatus`는 null입니다. true/false 값이 아니라 `OPEN`·`HANDLED` 문자열입니다. 새 신호가 붙으면 `HANDLED`였던 쪽지도 다시 `OPEN`이 됩니다.

**20 `GET /teacher/signals?status=`** — T03 목록. `status`는 OPEN(“아직 안 했어요”) 또는 HANDLED(“했어요”), 생략=모두. 정렬은 OPEN 먼저, 같은 상태에서 CRITICAL 먼저, 최신 순. matchedText는 걸린 낙말의 정규화 값이 아니라 사전의 원문 표현(공백 포함, 예: “죽고 싶다”)이다.

```json
{ "items": [ { "id": 5, "status": "OPEN", "matchedText": "죽고 싶다",
  "student": { "id": 12, "nickname": "하늘", "assignedAt": "2026-11-04T10:30:00+09:00" },
  "message": { "id": 101, "threadId": 31, "body": "...", "createdAt": "2026-11-04T10:30:00+09:00" },
  "handledAt": null, "responseMemo": null, "createdAt": "2026-11-04T10:30:00+09:00" } ] }
```

**21 `PATCH /teacher/signals/{id}`** — 대응 기록 남기기. 응답은 20의 항목 1개.

```json
{ "handled": true, "memo": "다음 날 담임과 통화했고 1388을 안내했다" }
```

`handled:true`면 status=HANDLED, `handled_at`=처음 처리한 시각(이미 값이 있으면 다시 눌러도 그대로 둔다). `false`면 OPEN으로 되돌리며 `handled_at`은 지우지 않고 응답에서만 뺀다(다시 처리하면 처음 시각으로 돌아온다). `memo`는 500자 이하이고 생략하면 그대로 두며 학습자에게는 절대 보이지 않는다. 담당 학습자의 신호가 아니면 `FORBIDDEN`.

## 알림 (22–24)

학습자와 이음쌤이 같은 API를 쓰고, 서버는 토큰의 사용자 id로 본인 알림만 내려줍니다. 알림 행은 따로 만드는 API가 없고, 쪽지·배정 API가 자기 일을 처리하는 같은 트랜잭션 안에서 함께 저장합니다.

### 22. GET /notifications?unread=

`unread=true`면 안 읽은 것만, 생략하면 전체를 최신순으로 최대 50건 내려줍니다. 사이드 메뉴의 알림 배지 숫자는 `unreadCount`로 그립니다.

```json
{ "unreadCount": 3,
  "items": [ { "id": 41, "type": "REPLY_ARRIVED", "title": "이음쌤의 답장이 도착했어요", "body": "쪽지함에서 확인해 보세요",
               "linkType": "THREAD", "linkId": 7, "isRead": false, "createdAt": "2026-11-02T09:12:00+09:00" } ] }
```

### 23. PATCH /notifications/{id}/read

알림 한 건을 읽음으로 바꾸고 `204`를 돌려줍니다. 이미 읽은 알림이면 아무것도 바꾸지 않습니다. 다른 사람의 알림이거나 없는 id면 `NOT_FOUND`입니다.

### 24. PATCH /notifications/read-all

내 안 읽은 알림을 모두 읽음으로 바꾸고 바뀐 개수를 돌려줍니다.

```json
{ "updated": 3 }
```

### 알림이 만들어지는 때

쪽지 12·15번 API와 14번, 배정 로직이 같은 트랜잭션 안에서 `notifications`에 행을 넣습니다. 쪽지 저장이 실패하면 알림도 남지 않습니다.

| 일어난 일 | 만들어지는 알림 | 받는 사람 | 누르면 가는 곳 |
| --- | --- | --- | --- |
| 학습자가 쪽지를 보냄(12, 15) | `NOTE_RECEIVED` 새 쪽지가 도착했어요 | 담당 이음쌤 | 쪽지 묶음(T02) |
| 같은 쪽지에서 신호가 보임(12, 15) | `SIGNAL_FLAGGED` 확인이 필요한 쪽지가 있어요 | 담당 이음쌤만 | 신호 대응 기록(T03) |
| 이음쌤이 답장함(15) | `REPLY_ARRIVED` 이음쌤의 답장이 도착했어요 | 해당 학습자 | 쪽지 묶음(S12) |
| 이음쌤이 처음 쪽지 묶음을 엶(14, `read_at`이 비어 있을 때만) | `NOTE_READ` 이음쌤이 쪽지를 읽었어요 | 해당 학습자 | 쪽지 묶음(S12) |
| 첫 쪽지로 담당 이음쌤이 정해짐(12) | `TEACHER_ASSIGNED` 담당 이음쌤이 정해졌어요 | 해당 학습자 | 내 정보(S14) |
| 같은 배정 | `LEARNER_ASSIGNED` 새 학습자가 배정됐어요 | 담당 이음쌤 | 학습자(T01) |

알림의 제목과 본문은 서버가 정해 둔 문구만 씁니다. 쪽지 본문, 학습자가 쓴 글, 찾은 낱말은 넣지 않고, 학습자 계정에는 `SIGNAL_FLAGGED`를 만들지 않습니다. 문자나 메일로는 보내지 않고 앱 안에서만 보여 줍니다.

알림 본문과 누르면 가는 곳은 아래처럼 정해져 있고, 응답의 `linkType`·`linkId`로 내려갑니다. `linkType`은 THREAD(쪽지 묶음), SIGNAL(신호 목록), PROFILE(내 정보), STUDENT(이음쌤 홈의 학습자) 네 가지입니다.

| type | 본문 | linkType | linkId |
| --- | --- | --- | --- |
| `NOTE_RECEIVED` | 쪽지 모아 보기에서 확인해 보세요 | THREAD | 쪽지 묶음 id |
| `SIGNAL_FLAGGED` | 신호 목록에서 확인해 보세요 | SIGNAL | 신호 id |
| `REPLY_ARRIVED` | 쪽지함에서 확인해 보세요 | THREAD | 쪽지 묶음 id |
| `NOTE_READ` | 쪽지함에서 확인해 보세요 | THREAD | 쪽지 묶음 id |
| `TEACHER_ASSIGNED` | 내 정보에서 확인해 보세요 | PROFILE | 없음(null) |
| `LEARNER_ASSIGNED` | 이음쌤 홈에서 확인해 보세요 | STUDENT | 학습자 id |

## content_json·answers_json 형식

형식은 `practices.type`마다 다릅니다. 화면이 쓰는 이름 그대로 두었습니다.

```json
// UNIT — content_json (질문 8개, 카드 5장 이내)
{ "questions": [
    { "id": "q1", "text": "...",
      "options": [ { "id": "a", "label": "..." }, { "id": "b", "label": "..." }, { "id": "c", "label": "잘 모르겠어요" } ],
      "compare": { "title": "...", "best": "b", "reason": "..." } } ],
  "cards": [ { "title": "...", "l1": "...", "l2": "..." } ] }
// UNIT — answers_json (cardsRead는 1부터 세는 카드 번호)
{ "pre": { "q1": "c" }, "cardsRead": [1, 2, 3, 4, 5], "post": { "q1": "b" } }

// SCENARIO — content_json
{ "scene": "장면 설명", "situation": "...",
  "choices": [ { "id": "c1", "text": "...", "follow": "이어지는 일", "hear": "이렇게 들릴 수 있어요" } ],
  "remember": [ "...", "...", "..." ],
  "feelings": [ { "id": "f1", "label": "불안해요" } ] }
// SCENARIO — answers_json  ("나에게 한 줄"은 my_note 컬럼)
{ "choice": "c1", "feelings": ["f1"] }

// EMOTION — content_json
{ "scene": "장면 설명", "situation": "...",
  "clues": [ { "id": "k1", "label": "시선이 아래로 향해요" } ],
  "feelings": [ { "id": "f1", "label": "서운해요" }, { "id": "f9", "label": "잘 모르겠어요", "exclusive": true } ],
  "keyClue": "...", "askLine": "괜찮아? 이야기하고 싶으면 언제든 들을게." }
// EMOTION — answers_json
{ "clues": ["k1"], "feelings": ["f1"] }
```

`exclusive:true`인 마음(“잘 모르겠어요”)은 다른 마음과 함께 고를 수 없고, 서버도 10번 API에서 `VALIDATION_FAILED`로 막는다.
