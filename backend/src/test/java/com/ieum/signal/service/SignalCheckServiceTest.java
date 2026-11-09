package com.ieum.signal.service;

import com.ieum.message.entity.Message;
import com.ieum.message.entity.SenderRole;
import com.ieum.signal.entity.MatchType;
import com.ieum.signal.entity.Severity;
import com.ieum.signal.entity.SignalEvent;
import com.ieum.signal.entity.SignalKeyword;
import com.ieum.signal.entity.SignalStatus;
import com.ieum.signal.repository.SignalEventRepository;
import com.ieum.signal.repository.SignalKeywordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.BeanUtils;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** [역할] 신호 검사(47)의 정규화·일치·우선순위 규칙을 DB 없이 확인한다. */
class SignalCheckServiceTest {

    private SignalKeywordRepository keywordRepository;
    private SignalEventRepository eventRepository;
    private SignalCheckService service;

    @BeforeEach
    void setUp() {
        keywordRepository = mock(SignalKeywordRepository.class);
        eventRepository = mock(SignalEventRepository.class);
        service = new SignalCheckService(keywordRepository, eventRepository);
    }

    private SignalKeyword keyword(long id, Severity severity, String normalized) {
        SignalKeyword k = BeanUtils.instantiateClass(SignalKeyword.class);
        ReflectionTestUtils.setField(k, "id", id);
        ReflectionTestUtils.setField(k, "severity", severity);
        ReflectionTestUtils.setField(k, "normalized", normalized);
        ReflectionTestUtils.setField(k, "matchType", MatchType.WORD);
        ReflectionTestUtils.setField(k, "active", true);
        return k;
    }

    private Message message(long id, SenderRole role, String body) {
        Message m = new Message(10L, role, body);
        ReflectionTestUtils.setField(m, "id", id);
        return m;
    }

    private void dictionary(SignalKeyword... keywords) {
        when(keywordRepository.findByActiveTrueAndMatchType(MatchType.WORD)).thenReturn(List.of(keywords));
    }

    @Test
    void 공백과_특수문자를_빼고_낱말을_찾는다() {
        dictionary(keyword(1, Severity.CRITICAL, "죽고싶다"));

        service.check(message(100, SenderRole.STUDENT, "요즘 너무 죽고... 싶다!!"), 5L, 9L);

        ArgumentCaptor<SignalEvent> captor = ArgumentCaptor.forClass(SignalEvent.class);
        verify(eventRepository).save(captor.capture());
        SignalEvent saved = captor.getValue();
        assertThat(saved.getStudentId()).isEqualTo(5L);
        assertThat(saved.getMessageId()).isEqualTo(100L);
        assertThat(saved.getKeywordId()).isEqualTo(1L);
        assertThat(saved.getMatchedText()).isEqualTo("죽고싶다");
        assertThat(saved.getStatus()).isEqualTo(SignalStatus.OPEN);
    }

    @Test
    void 영문은_대소문자를_가리지_않는다() {
        dictionary(keyword(2, Severity.WARNING, "suicide"));

        service.check(message(101, SenderRole.STUDENT, "Su-I-Cide"), 5L, 9L);

        verify(eventRepository).save(any(SignalEvent.class));
    }

    @Test
    void 일치하는_낱말이_없으면_저장하지_않는다() {
        dictionary(keyword(1, Severity.CRITICAL, "죽고싶다"));

        service.check(message(102, SenderRole.STUDENT, "오늘 급식이 맛있었어요"), 5L, 9L);

        verify(eventRepository, never()).save(any(SignalEvent.class));
    }

    @Test
    void 여러_낱말이_맞으면_치명이_먼저다() {
        dictionary(
                keyword(1, Severity.WARNING, "힘들다"),
                keyword(7, Severity.CRITICAL, "투신"));

        service.check(message(103, SenderRole.STUDENT, "너무 힘들다 투신 생각"), 5L, 9L);

        ArgumentCaptor<SignalEvent> captor = ArgumentCaptor.forClass(SignalEvent.class);
        verify(eventRepository).save(captor.capture());
        assertThat(captor.getValue().getKeywordId()).isEqualTo(7L);
    }

    @Test
    void 같은_등급이면_id가_작은_낱말을_고른다() {
        dictionary(
                keyword(9, Severity.WARNING, "따돌림"),
                keyword(3, Severity.WARNING, "왕따"));

        service.check(message(104, SenderRole.STUDENT, "왕따 따돌림"), 5L, 9L);

        ArgumentCaptor<SignalEvent> captor = ArgumentCaptor.forClass(SignalEvent.class);
        verify(eventRepository).save(captor.capture());
        assertThat(captor.getValue().getKeywordId()).isEqualTo(3L);
    }

    @Test
    void 이미_신호가_있는_쪽지는_다시_저장하지_않는다() {
        dictionary(keyword(1, Severity.CRITICAL, "죽고싶다"));
        when(eventRepository.existsByMessageId(105L)).thenReturn(true);

        service.check(message(105, SenderRole.STUDENT, "죽고 싶다"), 5L, 9L);

        verify(eventRepository, never()).save(any(SignalEvent.class));
    }

    @Test
    void 이음쌤이_보낸_쪽지는_검사하지_않는다() {
        dictionary(keyword(1, Severity.CRITICAL, "죽고싶다"));

        service.check(message(106, SenderRole.TEACHER, "죽고 싶다는 말은 안 해도 돼요"), 5L, 9L);

        verify(eventRepository, never()).save(any(SignalEvent.class));
    }

    @Test
    void 특수문자만_있는_본문은_검사하지_않는다() {
        service.check(message(107, SenderRole.STUDENT, "?!?! ..."), 5L, 9L);

        verify(keywordRepository, never()).findByActiveTrueAndMatchType(any());
        verify(eventRepository, never()).save(any(SignalEvent.class));
    }
}
