
-- 1) 계정: 학습자·이음쌤 공통
CREATE TABLE users (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  login_id            VARCHAR(20)  NOT NULL,                         -- 영문·숫자 4~20자, 대소문자 구분 없이 유일
  password_hash       VARCHAR(100) NOT NULL,                         -- BCrypt
  role                ENUM('STUDENT','TEACHER') NOT NULL DEFAULT 'STUDENT',
  status              ENUM('ACTIVE','PENDING_GUARDIAN') NOT NULL DEFAULT 'ACTIVE',
  name                VARCHAR(30)  NOT NULL,
  nickname            VARCHAR(20)  NOT NULL,                         -- 중복 허용
  birth_date          DATE NULL,                                     -- 학습자는 필수, 이음쌤은 비워도 됨
  phone               VARCHAR(11)  NULL,
  email               VARCHAR(100) NULL,
  school              VARCHAR(50)  NULL,
  guardian_name       VARCHAR(30)  NULL,                             -- 만 14세 미만만
  guardian_relation   ENUM('PARENT','RELATIVE','FACILITY','OTHER') NULL,
  guardian_contact    VARCHAR(100) NULL,
  teacher_id          BIGINT UNSIGNED NULL,                          -- 담당 이음쌤 (첫 쪽지 때 자동 배정)
  teacher_assigned_at DATETIME NULL,
  terms_agreed_at     DATETIME NOT NULL,
  last_login_at       DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_login_id (login_id),
  KEY ix_users_teacher (teacher_id),
  CONSTRAINT fk_users_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 2) 연습 콘텐츠: 질문지 단위 · 시나리오 · 감정 읽기
CREATE TABLE practices (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type          ENUM('UNIT','SCENARIO','EMOTION') NOT NULL,
  area          ENUM('SAFETY','HELP','EMOTION') NOT NULL,            -- 안전 / 도움 구하기 / 감정 읽기
  topic         VARCHAR(30)  NOT NULL,                               -- 목록에 보이는 소분류 이름
  level         TINYINT UNSIGNED NOT NULL,                           -- 1 오팔, 2 아쿠아마린 …
  title         VARCHAR(60)  NOT NULL,
  summary       VARCHAR(200) NOT NULL,
  est_minutes   TINYINT UNSIGNED NOT NULL DEFAULT 10,
  content_json  JSON NOT NULL,                                       -- 형식은 type별로 다름
  sort_order    INT NOT NULL DEFAULT 0,
  published     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_practices_list (published, area, level, sort_order)
) ENGINE=InnoDB;

-- 3) 학습 기록: 학습자 × 연습 1행
CREATE TABLE practice_records (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  practice_id   BIGINT UNSIGNED NOT NULL,
  status        ENUM('IN_PROGRESS','DONE') NOT NULL DEFAULT 'IN_PROGRESS',
  answers_json  JSON NOT NULL,                                       -- 형식은 type별로 다름
  my_note       VARCHAR(500) NULL,                                   -- "나에게 한 줄". 이음쌤 API는 읽지 않는다
  started_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at  DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_records_user_practice (user_id, practice_id),
  KEY ix_records_user_status (user_id, status, updated_at),
  CONSTRAINT fk_records_user     FOREIGN KEY (user_id)     REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_records_practice FOREIGN KEY (practice_id) REFERENCES practices (id)
) ENGINE=InnoDB;

-- 4) 쪽지 묶음
CREATE TABLE message_threads (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id       BIGINT UNSIGNED NOT NULL,
  teacher_id       BIGINT UNSIGNED NOT NULL,
  topic            ENUM('FRIEND','ONLINE','SCHOOL','HOME','ETC') NOT NULL,
  practice_id      BIGINT UNSIGNED NULL,                             -- 연결된 시나리오
  status           ENUM('WAITING','ANSWERED') NOT NULL DEFAULT 'WAITING',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_threads_student (student_id, last_message_at),
  KEY ix_threads_teacher (teacher_id, status, last_message_at),
  CONSTRAINT fk_threads_student  FOREIGN KEY (student_id)  REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_threads_teacher  FOREIGN KEY (teacher_id)  REFERENCES users (id),
  CONSTRAINT fk_threads_practice FOREIGN KEY (practice_id) REFERENCES practices (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5) 쪽지 메시지
CREATE TABLE messages (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thread_id    BIGINT UNSIGNED NOT NULL,
  sender_role  ENUM('STUDENT','TEACHER') NOT NULL,
  body         VARCHAR(500) NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at      DATETIME NULL,                                        -- 받는 사람이 읽은 시각
  PRIMARY KEY (id),
  KEY ix_messages_thread (thread_id, id),
  KEY ix_messages_unread (thread_id, sender_role, read_at),
  CONSTRAINT fk_messages_thread FOREIGN KEY (thread_id) REFERENCES message_threads (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6) 신호 낱말 사전 (시드)
CREATE TABLE signal_keywords (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  severity    ENUM('CRITICAL','WARNING') NOT NULL,                   -- 치명 / 경고. 정렬에만 쓴다
  category    VARCHAR(30) NOT NULL,                                  -- 분류 (자살 및 극단 선택 …)
  headword    VARCHAR(30) NOT NULL,                                  -- 대표 단어
  expression  VARCHAR(50) NOT NULL,                                  -- 원래 표현
  normalized  VARCHAR(50) NOT NULL,                                  -- 소문자 + 한글·영문·숫자만
  match_type  ENUM('WORD','CHOSEONG') NOT NULL DEFAULT 'WORD',
  active      TINYINT(1) NOT NULL DEFAULT 1,                         -- CHOSEONG은 0으로 보관
  PRIMARY KEY (id),
  UNIQUE KEY uq_keywords (match_type, normalized)
) ENGINE=InnoDB;

-- 7) 신호 기록: 학습자 메시지 1건당 최대 1행
CREATE TABLE signal_events (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id     BIGINT UNSIGNED NOT NULL,
  message_id     BIGINT UNSIGNED NOT NULL,
  keyword_id     BIGINT UNSIGNED NOT NULL,
  matched_text   VARCHAR(50) NOT NULL,
  status         ENUM('OPEN','HANDLED') NOT NULL DEFAULT 'OPEN',
  response_memo  VARCHAR(500) NULL,                                  -- 대응 메모. 학습자에게 보이지 않음
  handled_at     DATETIME NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_signal_message (message_id),
  KEY ix_signal_status (status, created_at),
  KEY ix_signal_student (student_id),
  CONSTRAINT fk_signal_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_signal_message FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
  CONSTRAINT fk_signal_keyword FOREIGN KEY (keyword_id) REFERENCES signal_keywords (id)
) ENGINE=InnoDB;

-- 8) 앱 안 알림: 받는 사람별 새 소식과 읽음 상태
CREATE TABLE notifications (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,                              -- 받는 사람(학습자 또는 이음쌤)
  type        ENUM('NOTE_RECEIVED','SIGNAL_FLAGGED','LEARNER_ASSIGNED','REPLY_ARRIVED','NOTE_READ','TEACHER_ASSIGNED') NOT NULL,
  title       VARCHAR(80)  NOT NULL,                                 -- 서버가 정해 둔 문구만. 쪽지 본문·찾은 낱말 금지
  body        VARCHAR(200) NOT NULL,
  link_type   ENUM('THREAD','SIGNAL','PROFILE','STUDENT') NULL,      -- 누르면 이동할 곳
  link_id     BIGINT UNSIGNED NULL,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  read_at     DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_notifications_user (user_id, is_read, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;
