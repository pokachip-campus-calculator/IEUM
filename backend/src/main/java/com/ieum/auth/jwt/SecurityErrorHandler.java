package com.ieum.auth.jwt;

import com.ieum.common.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * [역할] 보안 필터 단계에서 난 오류(토큰 없음·권한 없음)를 공통 오류 형식으로 응답한다.
 * [동작] 인증이 없으면 UNAUTHORIZED(401), 권한이 모자라면 FORBIDDEN(403)을 { code, message } JSON으로 쓴다.
 * [연결] SecurityConfig가 등록한다 / ErrorCode, ErrorResponse와 같은 모양
 * [주의] 컨트롤러 밖이라 GlobalExceptionHandler가 닿지 않아서 JSON을 직접 쓴다. 문구는 ErrorCode만 고친다.
 */
@Component
public class SecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException e)
            throws IOException {
        write(response, ErrorCode.UNAUTHORIZED);
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException e)
            throws IOException {
        write(response, ErrorCode.FORBIDDEN);
    }

    private void write(HttpServletResponse response, ErrorCode ec) throws IOException {
        response.setStatus(ec.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        String message = ec.getMessage().replace("\\", "\\\\").replace("\"", "\\\"");
        response.getWriter().write("{\"code\":\"" + ec.name() + "\",\"message\":\"" + message + "\"}");
    }
}
