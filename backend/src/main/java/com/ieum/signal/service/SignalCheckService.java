package com.ieum.signal.service;

import com.ieum.message.entity.Message;
import org.springframework.stereotype.Service;

/**
 * [역할] 학습자가 보낸 메시지에서 신호 낱말을 찾는다.
 * [동작] 지금은 호출 자리만 만든 빈 구현이다. #47에서 정규화·일치 검사와 signal_events 저장을 채운다.
 * [연결] ThreadService가 쪽지를 저장한 같은 트랜잭션에서 부른다(12, 이후 15) / signal_events, signal_keywords
 * [주의] 결과는 학습자 응답에 절대 넣지 않는다. 호출하는 쪽 시그니처를 바꾸지 않도록 #47은 이 메서드 안만 고친다.
 */
@Service
public class SignalCheckService {

    public void check(Message message, Long studentId, Long teacherId) {
        // #47에서 구현
    }
}
