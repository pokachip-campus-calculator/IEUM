-- 이음 운영 SQL 4개 (기준서 4장 "시드와 운영 SQL"). Workbench에서 필요한 것만 골라 실행한다.
-- Workbench 안전 업데이트 모드(Error 1175)에 걸리면 한 번만 실행: SET SQL_SAFE_UPDATES = 0;

-- (1) 이음쌤 계정 등록 — 이음쌤은 가입 화면이 아니라 운영자가 DB에 직접 넣는다
--     password_hash는 BCrypt 해시(60자). 이음쌤마다 login_id·이름을 바꿔 한 줄씩 추가
--     V4부터 birth_date가 NOT NULL이라 생년월일을 반드시 넣는다
INSERT INTO users (login_id, password_hash, role, name, nickname, birth_date, terms_agreed_at)
VALUES ('teacher03', '여기에BCrypt해시', 'TEACHER', '이름', '○○ 이음쌤', '1990-01-01', NOW());

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

-- (5) 담당 이음쌤 이관 — 학습자의 담당 이음쌤을 다른 이음쌤으로 바꾸고, 새 이음쌤에게 알림을 보낸다
--     이음쌤끼리 신청·수락하는 기능(V6, API)이 안 될 때를 위한 운영자용 대비책이다. 학습자에게는 알림을 보내지 않는다.
--     users.teacher_id(학습자의 담당)와 message_threads.teacher_id(쪽지 묶음의 이음쌤)를 함께 바꾸고,
--     알림 1건(새 이음쌤: LEARNER_ASSIGNED)을 만든다. 알림 문구는 서버가 쓰는 고정 문구와 같다.
--     아래 '학습자아이디'와 '새이음쌤아이디'만 바꿔서 통째로 실행한다. 확인 뒤 COMMIT, 이상하면 ROLLBACK.
SET time_zone = '+09:00';
SET @student = (SELECT id FROM users WHERE login_id = '학습자아이디' AND role = 'STUDENT');
SET @newt    = (SELECT id FROM users WHERE login_id = '새이음쌤아이디' AND role = 'TEACHER' AND status = 'ACTIVE');
SELECT @student AS 학습자id, @newt AS 새이음쌤id;   -- 둘 다 숫자여야 한다. NULL이면 아이디가 틀린 것이라 아래는 아무것도 바꾸지 않는다

START TRANSACTION;
UPDATE users SET teacher_id = @newt, teacher_assigned_at = NOW()
WHERE id = @student AND @newt IS NOT NULL;
UPDATE message_threads SET teacher_id = @newt
WHERE student_id = @student AND @newt IS NOT NULL;
INSERT INTO notifications (user_id, type, title, body, link_type, link_id)
SELECT @newt, 'LEARNER_ASSIGNED', '새 학습자가 배정됐어요', '이음쌤 홈에서 확인해 보세요', 'STUDENT', @student
WHERE @student IS NOT NULL AND @newt IS NOT NULL;

SELECT id, login_id, teacher_id, teacher_assigned_at FROM users WHERE id = @student;
SELECT id, teacher_id FROM message_threads WHERE student_id = @student;
SELECT user_id, type, title FROM notifications WHERE user_id = @newt ORDER BY id DESC LIMIT 1;
-- 맞으면 COMMIT;  이상하면 ROLLBACK;
