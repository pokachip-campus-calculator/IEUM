package com.ieum.mock;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.common.ErrorResponse;
import com.ieum.user.entity.Role;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * [역할] Mock 컨트롤러들이 같이 쓰는 도구 모음(응답 만들기, 역할·입력 검사, 연습 content 읽기).
 * [동작] 값은 DB 없이 코드에 적은 샘플이고, 오류는 기준서의 오류 코드(ErrorCode)로만 낸다.
 * [연결] PracticeMockController, ThreadMockController, TeacherMockController, NotificationMockController
 * [주의] TODO: 실제 구현으로 교체한 뒤 이 파일과 resources/mock/ 폴더, *MockController는 함께 지운다.
 */
public final class MockSupport {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private MockSupport() {}

    // 응답 필드 순서를 기준서와 똑같이 유지하며 JSON 객체를 만든다: obj("id", 1, "nickname", "하늘")
    public static Map<String, Object> obj(Object... keyValues) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            map.put((String) keyValues[i], keyValues[i + 1]);
        }
        return map;
    }

    // 기준서 시간 규약: ISO-8601 한국 시간(+09:00), 초 단위
    public static String now() {
        return OffsetDateTime.now(KST).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME).replaceAll("\\.\\d+", "");
    }

    // 학습자 전용 API(09~13)를 이음쌤이 부르면 403 FORBIDDEN
    public static void requireStudent(AuthUser user) {
        if (user.role() != Role.STUDENT) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
    }

    // 쿼리 값이 허용 목록에 없으면 400 VALIDATION_FAILED (값이 없으면 통과)
    public static void checkAllowed(String field, String value, Set<String> allowed) {
        if (value != null && !allowed.contains(value)) {
            throw ApiException.invalid(field, field + " 값이 올바르지 않아요.");
        }
    }

    // body 1~500자, 공백만은 안 됨 (12·15번)
    public static void checkBody(String body) {
        if (body == null || body.isBlank()) {
            throw ApiException.invalid("body", "내용을 입력해 주세요.");
        }
        if (body.length() > 500) {
            throw ApiException.invalid("body", "500자 이하로 적어 주세요.");
        }
    }

    // 없는 id는 404 NOT_FOUND
    public static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND);
    }

    // 여러 입력 오류를 한 번에 낼 때
    public static ApiException invalid(List<ErrorResponse.FieldError> fieldErrors) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, fieldErrors);
    }

    // db/V3 시드의 content_json을 그대로 옮긴 resources/mock/practice-{id}.json (id 1 UNIT, 2 SCENARIO, 3 EMOTION)
    public static JsonNode practiceContent(long id) {
        try (InputStream in = MockSupport.class.getResourceAsStream("/mock/practice-" + id + ".json")) {
            if (in == null) {
                throw notFound();
            }
            return JSON.readTree(in);
        } catch (IOException e) {
            throw new IllegalStateException("mock 연습 content를 읽지 못했습니다: " + id, e);
        }
    }
}
