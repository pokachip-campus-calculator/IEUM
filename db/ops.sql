-- 이음 운영 SQL 4개 (기준서 4장 "시드와 운영 SQL"). Workbench에서 필요한 것만 골라 실행한다.
-- Workbench 안전 업데이트 모드(Error 1175)에 걸리면 한 번만 실행: SET SQL_SAFE_UPDATES = 0;

-- (1) 이음쌤 계정 등록 — 이음쌤은 가입 화면이 아니라 운영자가 DB에 직접 넣는다
--     password_hash는 BCrypt 해시(60자). 이음쌤마다 login_id·이름을 바꿔 한 줄씩 추가
INSERT INTO users (login_id, password_hash, role, name, nickname, terms_agreed_at)
VALUES ('teacher03', '여기에BCrypt해시', 'TEACHER', '이름', '○○ 이음쌤', NOW());

-- (2) 보호자 확인이 끝났을 때 (기관에서 확인한 뒤) — 만 14세 미만 가입자는 PENDING_GUARDIAN으로 시작해 로그인이 막힌다
SET @student_id = 0;   -- 확인이 끝난 학습자 users.id
UPDATE users SET status = 'ACTIVE'
WHERE id = @student_id AND status = 'PENDING_GUARDIAN';

-- (3) 비밀번호 초기화 — 아이디·비밀번호 찾기 화면을 대신한다
SET @login_id = '';    -- 초기화할 계정의 login_id
UPDATE users SET password_hash = '여기에BCrypt해시' WHERE login_id = @login_id;

-- (4) 마지막 이용 1년 지난 학습자 삭제 — 매월 수동 실행. 학습 기록·쪽지·신호는 연쇄로 함께 삭제된다
--     먼저 SELECT로 대상을 확인한 뒤 DELETE
SELECT id, login_id, last_login_at, created_at FROM users
WHERE role = 'STUDENT' AND COALESCE(last_login_at, created_at) < NOW() - INTERVAL 1 YEAR;

DELETE FROM users
WHERE role = 'STUDENT' AND COALESCE(last_login_at, created_at) < NOW() - INTERVAL 1 YEAR;
