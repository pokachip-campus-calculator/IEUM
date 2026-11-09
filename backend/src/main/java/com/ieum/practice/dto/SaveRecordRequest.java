package com.ieum.practice.dto;

import tools.jackson.databind.JsonNode;

/**
 * [역할] 진행 저장·마침 10 PUT /practices/{id}/record의 요청 본문.
 * [동작] answers는 연습 유형마다 모양이 달라 JSON 그대로 받는다. done·restart는 없으면 false로 본다.
 * [연결] PracticeDetailController → PracticeDetailService
 * [주의] restart:true이면 나머지 필드는 무시한다. myNote는 SCENARIO에서만 저장된다.
 */
public record SaveRecordRequest(JsonNode answers, String myNote, Boolean done, Boolean restart) {

    public boolean isDone() { return Boolean.TRUE.equals(done); }

    public boolean isRestart() { return Boolean.TRUE.equals(restart); }
}
