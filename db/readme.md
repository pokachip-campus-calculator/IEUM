# db/ — 이음 DB 작업공간

MySQL 8, InnoDB, utf8mb4. 테이블 9개이고, 스키마의 기준은 이 폴더의 SQL 파일이다. 백엔드는 테이블을 만들거나 바꾸지 않는다(`ddl-auto: none`).

- 구조와 설계 이유: [DB설계.md](../docs/2-설계/DB설계.md) (ERD, 테이블 정의서, 설계 결정, 인덱스)
- ERD 그림: [ERD.png](../docs/2-설계/ERD.png)

## 파일

| 파일 | 내용 | 비고 |
|---|---|---|
| `V1__init.sql` | 테이블 8개 DDL, 인덱스, 외래키 | |
| `V2__seed_signal_keywords.sql` | 신호 낱말 사전 107행 (낱말 95 active, 초성 12 inactive) | 쪽지 신호 검사가 읽는다 |
| `V3__seed_practices.sql` | 연습 콘텐츠 3건 (질문지, 시나리오, 감정 읽기) | |
| `V4__users_birth_date_not_null.sql` | `users.birth_date`를 NOT NULL로 변경 | 이음쌤도 생년월일 필수 |
| `V5__seed_practices_more.sql` | 연습 콘텐츠 3건 추가 → 연습 6건 | 다시 실행해도 중복되지 않는다 |
| `V6__transfer_requests.sql` | 이관 신청 테이블 `transfer_requests` 추가, 알림 종류 확장 → 테이블 9개 | 이음쌤끼리 하는 담당 이관용. 백엔드는 V6 실행 뒤에 배포한다 |
| `ops.sql` | 운영 SQL 5개 | 이음쌤 등록, 보호자 확인, 비밀번호 초기화, 1년 미이용 학습자 삭제, 담당 이음쌤 이관(새 이음쌤에게 알림, 운영자용 대비책). 필요한 것만 골라 실행한다 |

## 실행 방법 (MySQL Workbench)

1. DB를 하나 만들고(로컬은 `ieum_dev`) Schemas에서 **Set as Default Schema**를 한다. SQL 파일에는 `USE`가 없어서 기본 스키마에서 실행된다.
2. **V1 → V2 → V3 → V4 → V5 → V6** 번호 순서대로 한 번씩 연다. 번개 아이콘 중 **왼쪽(Execute all)** 으로 실행한다.
3. 로컬 DB와 배포 DB(Railway) 모두 같은 파일을 같은 순서로 실행한다. 새 파일이 생기면 로컬 → Git → 배포 순서로 한다.
4. Error 1175(안전 업데이트 모드)가 나면 먼저 `SET SQL_SAFE_UPDATES = 0;`을 실행한다.

실행 뒤 확인:

```sql
SHOW TABLES;                                          -- 9개
SELECT COUNT(*) FROM signal_keywords;                 -- 107
SELECT id, type, area, level, title, JSON_VALID(content_json) AS ok
FROM practices ORDER BY area, level, id;              -- 6행, ok가 모두 1
```

## 규칙

- **이미 실행한 파일은 고치지 않는다.** 바꿀 때는 새 번호 파일(`V6__…`)을 만든다. 번호는 DB 담당이 정한다.
- 레포가 Public이다. DB 비밀번호, 비밀번호 해시, 접속 주소, `.env`는 이 폴더에도 올리지 않는다. 이음쌤 계정(해시 포함)도 Git에 올리지 않고 `ops.sql`의 (1)처럼 본인이 만든 BCrypt 해시를 넣어 DB에 직접 등록한다.
- 로컬에서 먼저 실행해 확인한 뒤 PR로 올리고, 배포 DB에는 그다음에 실행한다.
- 커밋 메시지는 `sql: 한글 설명 #이슈번호`.

## 자주 만나는 상황

| 상황 | 해결 |
|---|---|
| `Table ... doesn't exist` | 기본 스키마가 잘못됐다. Set as Default Schema를 다시 한다 |
| 결과가 일부 행만 보인다 | 첫 문장만 실행된 것이다. Execute all(왼쪽 번개)로 다시 실행한다 |
| 로그인이 `UNAUTHORIZED`로 보이는데 원인을 모르겠다 | 서버 콘솔의 `Access denied`·`Unknown database` 같은 DB 오류부터 본다 |

## 담당

DB 설계·구축·운영: 황하윤
