package com.ieum.notification.repository;

import com.ieum.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

/** [역할] notifications 테이블 조회·저장 통로. */
public interface NotificationRepository extends JpaRepository<Notification, Long> {
}
