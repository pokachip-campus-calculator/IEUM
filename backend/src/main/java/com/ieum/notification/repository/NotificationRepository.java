package com.ieum.notification.repository;

import com.ieum.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** [역할] notifications 테이블 조회·저장 통로. 모든 조회는 받는 사람(user_id) 기준이라 남의 알림은 닿지 않는다. */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 내 알림 전체, 최신순 최대 50건
    List<Notification> findTop50ByUserIdOrderByCreatedAtDescIdDesc(Long userId);

    // 내 안 읽은 알림만, 최신순 최대 50건
    List<Notification> findTop50ByUserIdAndReadFalseOrderByCreatedAtDescIdDesc(Long userId);

    // 사이드 메뉴 배지 숫자(50건 제한과 무관한 전체 안 읽음 수)
    long countByUserIdAndReadFalse(Long userId);

    // 내 알림 한 건. 남의 알림이면 비어 있다
    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    // 내 안 읽은 알림을 한 번에 읽음으로 바꾸고 바뀐 개수를 돌려준다
    @Modifying
    @Query("update Notification n set n.read = true, n.readAt = :now where n.userId = :userId and n.read = false")
    int markAllRead(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
