-- 이음쌤도 가입 때 생년월일을 필수로 받는다 (화면·API 01 기준). users.birth_date를 NOT NULL로 바꾼다.
-- 이미 NULL로 들어간 이음쌤 계정(시드)은 임시 생년월일로 채운다. 학습자는 채우지 않는다:
--   임의 값을 넣으면 만 14세 미만 판정이 틀어지므로, NULL인 학습자가 있으면 아래 ALTER가 실패해 알려 준다.
-- Workbench에서 Error 1175가 나면 먼저 한 번 실행: SET SQL_SAFE_UPDATES = 0;

UPDATE users SET birth_date = '1990-01-01' WHERE birth_date IS NULL AND role = 'TEACHER';

ALTER TABLE users MODIFY COLUMN birth_date DATE NOT NULL;
