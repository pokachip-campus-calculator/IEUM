package com.ieum.practice.dto;

import java.util.List;

/** [역할] 연습 목록(08) 응답 { "items": [...] }. */
public record PracticeListResponse(List<PracticeItem> items) {
}
