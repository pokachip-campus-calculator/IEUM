# API 명세서

> 프론트엔드-백엔드 데이터 통신 규약. 초안 작성 후 개발하면서 최신화하고 팀원에게 공유합니다.
> 전체 24개 API의 기준은 `이음 MVP 개발 기준서` 3장이고(레포에는 올리지 않는 내부 문서), 이 문서에는 구현이 끝난 API를 옮겨 적습니다.

## 공통 규약
| 항목 | 규약 |
|---|---|
| 기본 경로 | `/api/v1`, JSON(UTF-8) |
| 인증 | `Authorization: Bearer <JWT>`. 가입·로그인만 공개. `/teacher/**`는 role=TEACHER만 |
| 시간 | ISO-8601 한국 시간, 예: `2026-11-04T10:30:00+09:00` |
| 성공 응답 | 본문을 그대로 내린다(봉투 없음) |
| 목록 | 페이지네이션 없이 `{"items":[...]}` 한 번에 내린다 |
| 오류 응답 | `{"code":"...","message":"...","fieldErrors":[{"field":"...","message":"..."}]}` (fieldErrors는 입력 오류일 때만) |

## API 목록
| 번호 | 기능 | Method | Endpoint | 담당자 | 상태 |
|---|---|---|---|---|---|
| 7 | 홈 | GET | /api/v1/home | 이영주 | 구현 완료 (#43) |
| 8 | 연습 목록 | GET | /api/v1/practices | 이영주 | 구현 완료 (#43) |

## 상세

### 7. 홈 (S05)
- **Endpoint**: `/api/v1/home`
- **Method**: GET
- **권한**: 로그인한 학습자만 (이음쌤은 403)

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

**에러 응답**
| 코드 | 설명 |
|---|---|
| 401 UNAUTHORIZED | 토큰이 없거나 만료됨 |
| 403 FORBIDDEN | 학습자가 아닌 계정(이음쌤) |

### 8. 연습 목록 (S06)
- **Endpoint**: `/api/v1/practices?area=&level=&q=`
- **Method**: GET
- **권한**: 로그인한 학습자만 (이음쌤은 403)

**Request (쿼리, 모두 선택)**
| 이름 | 설명 |
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

**규칙**
- `myStatus`는 `NONE`(기록 없음), `IN_PROGRESS`, `DONE`.
- `published=1`만 내리고 정렬은 영역(SAFETY→HELP→EMOTION), 단계, `sort_order` 순.
- `content`는 포함하지 않는다. 조건에 맞는 연습이 없으면 `{"items":[]}`.

**에러 응답**
| 코드 | 설명 |
|---|---|
| 400 VALIDATION_FAILED | `area`가 목록 밖의 값이거나 `level`이 숫자가 아님 (`fieldErrors`의 field가 `area` 또는 `level`) |
| 401 UNAUTHORIZED | 토큰이 없거나 만료됨 |
| 403 FORBIDDEN | 학습자가 아닌 계정(이음쌤) |
