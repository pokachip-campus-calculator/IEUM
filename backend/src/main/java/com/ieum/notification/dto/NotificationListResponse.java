package com.ieum.notification.dto;

import com.ieum.notification.entity.LinkType;
import com.ieum.notification.entity.NotificationType;

import java.time.OffsetDateTime;
import java.util.List;

/** [역할] 알림 목록(22) 응답. unreadCount는 목록 건수와 상관없는 내 전체 안 읽음 수다. */
public record NotificationListResponse(long unreadCount, List<Item> items) {

    /** [역할] 알림 한 건. 이동할 곳이 없으면 linkType·linkId는 null이고, transferStatus는 linkType이 TRANSFER일 때만 PENDING·ACCEPTED·EXPIRED로 채운다. */
    public record Item(Long id, NotificationType type, String title, String body,
                       LinkType linkType, Long linkId, boolean isRead, OffsetDateTime createdAt,
                       String transferStatus) {}
}
