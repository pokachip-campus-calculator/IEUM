-- 이음쌤끼리 하는 담당 이관: 신청 기록 테이블 추가와 알림 종류 확장
-- 흐름: 이음쌤 A가 자기 학습자를 이관 신청 → 이음쌤 B에게 알림(TRANSFER_REQUESTED) → B가 수락하면 담당이 바뀌고 A에게 알림(TRANSFER_ACCEPTED).
-- 거절은 없다. 학습자에게는 알림을 보내지 않는다.
-- 어디서 쓰나: 이음쌤 학습자 상세 화면의 "이관 신청" 버튼(신청 API)과 알림 화면의 "수락" 버튼(수락 API)이 transfer_requests를 읽고 쓴다.
-- 기다리는 신청은 학습자당 1건만 둔다. 이 규칙은 DB가 아니라 신청 API가 신청할 때 확인한다(status = 'PENDING'인 행이 있으면 409).
-- 실행 순서: 백엔드가 새 알림 종류를 알기 전에 DB를 먼저 바꿔도 안전하다(새 값을 쓰는 행이 아직 없다). 백엔드는 V6 실행 뒤에 배포한다.

-- 9) 이관 신청: 학습자 한 명을 이음쌤 A에서 B로 옮기자는 요청
CREATE TABLE transfer_requests (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id       BIGINT UNSIGNED NOT NULL,                         -- 옮길 학습자(users.id). 학습자가 지워지면 신청도 지워진다
  from_teacher_id  BIGINT UNSIGNED NOT NULL,                         -- 신청한 이음쌤(지금 담당)
  to_teacher_id    BIGINT UNSIGNED NOT NULL,                         -- 받는 이음쌤(수락하는 사람)
  status           ENUM('PENDING','ACCEPTED') NOT NULL DEFAULT 'PENDING',  -- 기다림 / 수락함. 거절은 없다
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,      -- 신청한 시각
  handled_at       DATETIME NULL,                                    -- 수락한 시각
  PRIMARY KEY (id),
  KEY ix_transfer_to (to_teacher_id, status, created_at),
  KEY ix_transfer_student (student_id, status),
  CONSTRAINT fk_transfer_student FOREIGN KEY (student_id)      REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_transfer_from    FOREIGN KEY (from_teacher_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_transfer_to      FOREIGN KEY (to_teacher_id)   REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 알림 종류와 이동 대상에 이관 값을 더한다. 기존 값과 순서는 그대로 둔다.
ALTER TABLE notifications
  MODIFY type      ENUM('NOTE_RECEIVED','SIGNAL_FLAGGED','LEARNER_ASSIGNED','REPLY_ARRIVED','NOTE_READ','TEACHER_ASSIGNED','TRANSFER_REQUESTED','TRANSFER_ACCEPTED') NOT NULL,
  MODIFY link_type ENUM('THREAD','SIGNAL','PROFILE','STUDENT','TRANSFER') NULL;
