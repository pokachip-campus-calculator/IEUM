# 프론트 API 연동 안내

> 백엔드(이영주)가 프론트에 전달하는 안내입니다. 각 API의 요청·응답 전체는 [API명세서.md](API명세서.md)를 보세요.
> 가입·로그인·내 정보(01~06), 학습(07~11), 학습자 쪽지(12~15), 알림(22~24)은 사용자별 DB API를 사용합니다. 이음쌤 기능(16~21)은 아직 mock입니다.

## 1. 서버 주소와 기본 규칙
| 항목 | 내용 |
|---|---|
| 서버 주소 | 로컬 `http://localhost:8080/api/v1` (포트를 따로 바꾸지 않았다면 8080) |
| 인증 | 로그인(02)에서 받은 `token`을 `Authorization: Bearer <token>` 헤더에 넣는다. 가입·로그인만 토큰 없이 부른다 |
| 토큰 | 유효 7일. 재발급 API는 없고, 만료되면 401이 오니 다시 로그인한다 |
| 성공 응답 | 봉투 없이 본문을 그대로. 생성 201, 본문 없는 성공 204 |
| 오류 응답 | `{ "code": "...", "message": "...", "fieldErrors": [{ "field": "...", "message": "..." }] }`. `message`는 화면에 그대로 보여주는 문장이고, `fieldErrors`는 입력 오류(400)일 때만 온다 |
| 시간 | `2026-11-04T10:30:00+09:00` 형식 |
| 목록 | 페이지 없이 `{ "items": [...] }` 한 번에 |
| CORS | 서버가 `CORS_ALLOWED_ORIGINS` 환경변수로 허용 주소를 정한다. 기본값은 전체 허용이라 로컬에서는 따로 설정할 게 없다 |

**401은 로그아웃으로 처리하세요.** 그래서 현재 비밀번호가 틀린 경우(05)는 401이 아니라 400 `VALIDATION_FAILED`(`fieldErrors`의 field가 `currentPassword`)로 옵니다.

### 오류 코드
| code | HTTP | 화면에서 |
|---|---|---|
| VALIDATION_FAILED | 400 | `fieldErrors`의 field 옆에 `message` 표시 |
| RECORD_INCOMPLETE | 400 | 마침(10번)에서 필수 선택이 빠짐 |
| UNAUTHORIZED | 401 | 로그아웃 처리 |
| BAD_CREDENTIALS | 401 | 로그인 실패 문구 |
| GUARDIAN_PENDING | 403 | 만 14세 미만 보호자 확인 전. `message`를 그대로 보여준다 |
| FORBIDDEN | 403 | 남의 자원이거나 역할이 맞지 않음 |
| NOT_FOUND | 404 | 없는 id |
| LOGIN_ID_TAKEN | 409 | 가입 아이디 중복 |
| NO_TEACHER_AVAILABLE | 409 | 쪽지를 맡을 이음쌤이 없음 |

## 1-1. 서버를 내 PC에서 실행하기 (로컬 MySQL)
로그인(01~06)은 DB를 쓰는 진짜 API라서, 아직 배포된 서버가 없으니 각자 PC에서 서버를 실행해 확인합니다. (샘플 모드로 화면만 만들 때는 필요 없습니다.) 준비물은 JDK 21과 MySQL 8.0입니다.

1. **DB 만들기**: MySQL에서 아래를 실행합니다. `db/V1__init.sql`에는 DB 생성 문장이 없어서 먼저 만들어야 합니다.
   ```sql
   CREATE DATABASE IF NOT EXISTS ieum DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   ```
2. **테이블·시드 넣기**: `ieum` DB를 선택한 뒤 아래 순서대로 파일 내용을 직접 실행합니다(DBeaver, Workbench 등).
   `db/V1__init.sql` → `db/V2__seed_signal_keywords.sql` → `db/V3__seed_practices.sql`
3. **환경변수 파일 만들기**: `backend/.env.example`을 복사해 `backend/.env`를 만들고 값을 채웁니다(`.env`는 커밋하지 않습니다).
   ```
   DB_URL=jdbc:mysql://localhost:3306/ieum?serverTimezone=Asia/Seoul
   DB_USER=<내 MySQL 사용자>
   DB_PASSWORD=<내 MySQL 비밀번호>
   JWT_SECRET=<32자 이상 아무 문자열>
   CORS_ALLOWED_ORIGINS=*
   ```
4. **서버 실행**: `backend` 폴더에서 `./gradlew bootRun`(Windows 명령 프롬프트는 `gradlew.bat bootRun`). 뜨면 `http://localhost:8080/api/v1`로 부릅니다.
5. **확인**: `POST /api/v1/auth/signup`으로 가입한 뒤 `POST /api/v1/auth/login`으로 토큰을 받습니다. 이음쌤 화면은 `role: "TEACHER"`로 가입한 계정으로 로그인합니다.

막히면 서버를 켠 터미널의 오류 문구를 PR #59 댓글에 붙여 주세요.

## 2. 실제 API와 mock 구분표
| 번호 | 기능 | 주소 | 구분 | 진짜로 바뀌는 시점 |
|---|---|---|---|---|
| 01 | 가입 | POST /auth/signup | **실제** | 완료 |
| 02 | 로그인 | POST /auth/login | **실제** | 완료 |
| 03~06 | 내 정보·비밀번호·탈퇴 | /me... | **실제** | 완료 |
| 07, 08 | 홈, 연습 목록 | GET /home, /practices | **실제 DB** | 사용자별 기록으로 진행도 계산 |
| 09, 10 | 연습 상세, 진행 저장 | /practices/{id}, /practices/{id}/record | **실제 DB** | 학습 콘텐츠는 practices 시드를 사용 |
| 11 | 학습 기록 | GET /records | **실제 DB** | 사용자별 저장 기록과 나에게 한 줄 |
| 12, 13 | 쪽지 보내기, 쪽지함 | POST·GET /threads | **실제 DB** | 사용자별 쪽지 저장 |
| 14, 15 | 쪽지 상세, 이어쓰기 | /threads/{id}, /threads/{id}/messages | **실제 DB** | 사용자별 메시지 저장 |
| 16~18 | 이음쌤 홈 | /teacher/summary, /students... | mock | #50 |
| 19~21 | 이음쌤 쪽지·신호 | /teacher/threads, /signals... | mock | #51 |
| 22~24 | 알림 | /notifications... | **실제 DB** | 사용자별 알림 조회·읽음 처리 |

개발 서버의 `mock.learning.enabled`는 기본 `false`로 설정되어 있습니다. 학습·학습자 쪽지·알림 API는 DB를 사용하며, 이음쌤 화면은 mock 응답을 사용합니다.

### 프론트엔드 어댑터 연결 범위

- 연습 상세·진행·기록(09~11)은 `/practices/{id}`, `/practices/{id}/record`, `/records`를 사용합니다. 백엔드 `content`와 화면 모델이 다른 연습 유형은 프론트 서비스에서 변환합니다.
- 쪽지·알림(12~15, 22~24)은 `/threads`와 `/notifications` 계약에 맞춰 연결합니다. 읽음 처리는 개별 `PATCH /notifications/{id}/read` 또는 전체 `PATCH /notifications/read-all`을 사용합니다.
- 이음쌤 쪽지·신호 화면은 `/teacher/threads`, `/threads/{id}`, `/teacher/signals`, `PATCH /teacher/signals/{id}`를 사용합니다. `/teacher/students` 목록의 기록 상세는 아직 전체 화면 데이터와 연결되지 않았습니다.
- 약관과 영상 파일은 프론트 고정 콘텐츠로 유지합니다. 영상 연습 기록, 이음쌤 대응 메모, 강의 자료 게시, 이메일 인증·보호자 동의·알림 설정은 현재 백엔드 API가 없어 서버에 저장되지 않습니다.

## 3. mock을 쓸 때 알아둘 것
`mock.learning.enabled=true`로 설정하면 학습 관련 샘플 API를 명시적으로 켤 수 있습니다. 이 모드는 DB에 저장하지 않으며, 샘플 id만 응답합니다.

| 대상 | 쓸 수 있는 값 |
|---|---|
| 연습 id | 1 (UNIT, 안전, 마침), 2 (SCENARIO, 도움 구하기, 하는 중), 3 (EMOTION, 감정 읽기, 시작 전) |
| 쪽지 id | 31 (ONLINE, 답장 도착), 32 (SCHOOL, 답장 대기) |
| 이음쌤 화면의 학습자 id | 12 (하늘, 기록 상세 있음), 13 (바다). 18번은 12만 응답 |
| 신호 id | 5 (OPEN), 6 (HANDLED) |
| 알림 id | 41~44 |

- **로그인은 진짜입니다.** API는 로그인 토큰과 역할을 검사합니다. 학습자 전용 API(07~15)를 이음쌤 토큰으로 부르면 403, `/teacher/**`를 학습자 토큰으로 부르면 403입니다. 이음쌤 화면을 확인하려면 이음쌤 계정(가입 때 `role: "TEACHER"`)으로 로그인하세요.
- mock 연습 내용(09의 `content`)은 DB 시드와 같은 문구라서, 진짜로 바뀌어도 화면이 달라지지 않습니다.
- 학습 화면(S07~S09)은 09의 `content` 구조가 유형(UNIT·SCENARIO·EMOTION)마다 다릅니다. 형식은 명세서의 "content·answers 형식"을 보세요.

## 4. 오류 화면을 확인하는 방법 (mock)
| 확인하고 싶은 것 | 이렇게 부른다 |
|---|---|
| 404 화면 | 연습 `/practices/999`, 쪽지 `/threads/999`, 알림 `/notifications/999/read` |
| 마침 버튼의 필수 선택 오류 | 10번에 `{ "answers": {}, "done": true }` → 400 `RECORD_INCOMPLETE` |
| 쪽지 입력 오류 | 12번에 `body`를 공백으로, 또는 `topic`을 5개 값(FRIEND, ONLINE, SCHOOL, HOME, ETC) 밖으로 → 400 `VALIDATION_FAILED` + `fieldErrors` |
| 권한 오류 | 학습자 API를 이음쌤 토큰으로, `/teacher/**`를 학습자 토큰으로 |
| 401 | 토큰 없이 부르기 |

## 5. 기준서와 다르거나 임의로 정한 것
기준서에 없어서 백엔드가 정한 내용입니다. 자세한 목록은 명세서의 "임의로 추가한 명세"에 있습니다.
- 이음쌤(`role: TEACHER`) 가입도 `birthDate`가 필수입니다(기준서는 선택, PR #55에서 변경).
- 03번의 `teacher`는 `{ "id", "nickname" }`입니다(기준서 예시의 `assignedAt` 없음).
- 22번의 `createdAt`에는 `+09:00`이 붙습니다.
- 쿼리 값(`status`, `sort`, `area`, `level`, `unread`)이 허용 값 밖이면 400 `VALIDATION_FAILED`입니다.
- 14번의 `signal`은 이음쌤이 부를 때만 오고, 학습자 응답에는 키 자체가 없습니다. 15번의 `senderRole`은 호출한 사람의 역할입니다.
- 500 서버 오류용 별도 코드는 없습니다. 기준서에 없습니다.

## 6. 문의
응답이 이상하거나 명세와 다르면 백엔드(이영주)에게 알려 주세요. 연동 중 필요한 값이 빠져 있으면 기준서를 바꾸지 않고, 이슈로 추가를 정합니다.
