package com.ieum.signal.service;

import com.ieum.message.entity.Message;
import com.ieum.message.entity.SenderRole;
import com.ieum.notification.service.NotificationService;
import com.ieum.signal.entity.MatchType;
import com.ieum.signal.entity.Severity;
import com.ieum.signal.entity.SignalEvent;
import com.ieum.signal.entity.SignalKeyword;
import com.ieum.signal.repository.SignalEventRepository;
import com.ieum.signal.repository.SignalKeywordRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.Locale;
import java.util.Optional;

/**
 * [역할] 학습자가 보낸 메시지에서 신호 낱말을 찾아 signal_events에 남긴다.
 * [동작] 본문을 소문자로 바꾸고 한글·영문·숫자만 남긴 뒤, 사용 중인 WORD 낱말(normalized)이 들어 있는지 본다. 여러 개면 CRITICAL 우선, 같은 등급이면 id가 작은 하나만 저장한다.
 * [연결] ThreadService가 쪽지를 저장한 같은 트랜잭션에서 부른다(12, 이후 15) / SignalKeywordRepository, SignalEventRepository, NotificationService
 * [주의] 결과는 학습자 응답에 절대 넣지 않는다. 초성(CHOSEONG) 낱말은 검사하지 않는다. 메시지 1건당 신호는 최대 1행이고, 저장하면 담당 이음쌤에게 SIGNAL_FLAGGED 알림을 같이 만든다.
 */
@Service
public class SignalCheckService {

    private final SignalKeywordRepository keywordRepository;
    private final SignalEventRepository eventRepository;
    private final NotificationService notificationService;

    public SignalCheckService(SignalKeywordRepository keywordRepository, SignalEventRepository eventRepository,
                              NotificationService notificationService) {
        this.keywordRepository = keywordRepository;
        this.eventRepository = eventRepository;
        this.notificationService = notificationService;
    }

    public void check(Message message, Long studentId, Long teacherId) {
        if (message.getSenderRole() != SenderRole.STUDENT) {
            return;
        }
        if (eventRepository.existsByMessageId(message.getId())) {
            return;
        }

        String body = normalize(message.getBody());
        if (body.isEmpty()) {
            return;
        }

        Optional<SignalKeyword> found = keywordRepository.findByActiveTrueAndMatchType(MatchType.WORD).stream()
                .filter(k -> !k.getNormalized().isEmpty() && body.contains(k.getNormalized()))
                .min(Comparator.comparing((SignalKeyword k) -> k.getSeverity() == Severity.CRITICAL ? 0 : 1)
                        .thenComparing(SignalKeyword::getId));

        found.ifPresent(k -> {
            SignalEvent event = eventRepository.save(
                    new SignalEvent(studentId, message.getId(), k.getId(), k.getNormalized()));
            // 담당 이음쌤에게만 알린다. 학습자에게는 알림도 응답도 없다
            notificationService.signalFlagged(teacherId, event.getId());
        });
    }

    /** 소문자로 바꾸고 한글(완성형)·영문·숫자만 남긴다. 사전의 normalized와 같은 방식이다. */
    static String normalize(String text) {
        if (text == null) {
            return "";
        }
        String lower = Normalizer.normalize(text, Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
        StringBuilder sb = new StringBuilder(lower.length());
        for (int i = 0; i < lower.length(); i++) {
            char c = lower.charAt(i);
            if ((c >= '가' && c <= '힣') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
