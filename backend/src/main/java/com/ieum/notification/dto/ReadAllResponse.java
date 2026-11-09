package com.ieum.notification.dto;

/** [역할] 알림 모두 읽음(24) 응답. updated는 이번에 읽음으로 바뀐 개수다. */
public record ReadAllResponse(int updated) {}
