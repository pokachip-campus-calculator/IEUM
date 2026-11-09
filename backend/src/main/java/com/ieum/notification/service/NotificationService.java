package com.ieum.notification.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.notification.entity.Notification;
import com.ieum.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class NotificationService {

    private static final int PAGE_SIZE = 50;

    private final NotificationRepository notificationRepository;
    private final Clock clock;

    public NotificationService(NotificationRepository notificationRepository, Clock clock) {
        this.notificationRepository = notificationRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public NotificationList list(Long userId, String unreadValue) {
        Boolean unread = parseUnread(unreadValue);
        List<ApiNotification> items = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(item -> unread == null || !item.isRead() == unread)
                .limit(PAGE_SIZE)
                .map(this::toApiNotification)
                .toList();
        long unreadCount = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(item -> !item.isRead())
                .count();
        return new NotificationList(unreadCount, items);
    }

    @Transactional
    public void markRead(Long userId, Long id) {
        Notification notification = notificationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!notification.isRead()) {
            notification.markRead(java.time.LocalDateTime.now(clock));
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public ReadAllResult markAllRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(item -> !item.isRead())
                .toList();
        var now = java.time.LocalDateTime.now(clock);
        unread.forEach(item -> item.markRead(now));
        notificationRepository.saveAll(unread);
        return new ReadAllResult(unread.size());
    }

    private Boolean parseUnread(String value) {
        if (value == null || value.isBlank()) return null;
        if (value.equals("true")) return true;
        if (value.equals("false")) return false;
        throw com.ieum.common.ApiException.invalid("unread", "unread는 true 또는 false여야 합니다.");
    }

    private ApiNotification toApiNotification(Notification notification) {
        return new ApiNotification(notification.getId(), notification.getType(), notification.getTitle(),
                notification.getBody(), notification.getLinkType(), notification.getLinkId(),
                notification.isRead(), notification.getCreatedAt().atZone(clock.getZone()).toOffsetDateTime());
    }

    public record NotificationList(long unreadCount, List<ApiNotification> items) {}
    public record ApiNotification(Long id, com.ieum.notification.entity.NotificationType type, String title,
                                  String body, com.ieum.notification.entity.LinkType linkType,
                                  Long linkId, boolean isRead, OffsetDateTime createdAt) {}
    public record ReadAllResult(int updated) {}
}
