package com.ieum.transfer.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.message.entity.MessageThread;
import com.ieum.message.repository.MessageThreadRepository;
import com.ieum.notification.service.NotificationService;
import com.ieum.transfer.dto.TransferCreateResponse;
import com.ieum.transfer.entity.TransferRequest;
import com.ieum.transfer.entity.TransferStatus;
import com.ieum.transfer.repository.TransferRequestRepository;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import com.ieum.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

/**
 * [역할] 이음쌤끼리 하는 학습자 이관의 신청(25)과 수락(26)을 처리한다.
 * [동작] 신청은 신청 행(PENDING)을 만들고 받는 이음쌤에게 알림을 보낸다. 수락은 학습자의 담당과 쪽지 묶음의 이음쌤을 함께 바꾸고
 *        신청한 이음쌤에게 알림을 보낸다. 학습자에게는 알림을 보내지 않는다.
 * [연결] TransferController / UserRepository·MessageThreadRepository·TransferRequestRepository·NotificationService
 * [주의] 기다리는 신청이 학습자당 1건인 규칙은 DB가 아니라 여기서 확인한다(V6). 거절은 없다.
 */
@Service
public class TransferService {

    private final TransferRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final MessageThreadRepository threadRepository;
    private final NotificationService notificationService;
    private final Clock clock;

    public TransferService(TransferRequestRepository requestRepository, UserRepository userRepository,
                           MessageThreadRepository threadRepository, NotificationService notificationService, Clock clock) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.threadRepository = threadRepository;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    // 25: 내 담당 학습자를 다른 이음쌤(아이디로 지정)에게 신청한다
    @Transactional
    public TransferCreateResponse create(Long teacherId, Long studentId, String toLoginId) {
        User student = userRepository.findById(studentId).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (student.getRole() != Role.STUDENT || !teacherId.equals(student.getTeacherId())) {
            throw new ApiException(ErrorCode.FORBIDDEN);   // 내 담당이 아니면(18과 같은 규칙)
        }
        User to = userRepository.findByLoginId(toLoginId.trim().toLowerCase())
                .filter(t -> t.getRole() == Role.TEACHER && t.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (to.getId().equals(teacherId)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED);   // 나 자신에게는 신청할 수 없다
        }
        if (requestRepository.existsByStudentIdAndStatus(studentId, TransferStatus.PENDING)) {
            throw new ApiException(ErrorCode.TRANSFER_ALREADY_PENDING);
        }
        TransferRequest saved = requestRepository.save(new TransferRequest(studentId, teacherId, to.getId()));
        notificationService.transferRequested(to.getId(), saved.getId());
        return new TransferCreateResponse(saved.getId(), saved.getStatus(),
                saved.getCreatedAt().atZone(clock.getZone()).toOffsetDateTime());
    }

    // 26: 받는 이음쌤이 수락한다. 남의 신청·없는 번호는 구분 없이 NOT_FOUND
    @Transactional
    public void accept(Long teacherId, Long requestId) {
        TransferRequest request = requestRepository.findById(requestId)
                .filter(r -> teacherId.equals(r.getToTeacherId()))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (request.getStatus() != TransferStatus.PENDING) {
            throw new ApiException(ErrorCode.TRANSFER_NOT_PENDING);
        }
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!request.getFromTeacherId().equals(student.getTeacherId())) {
            throw new ApiException(ErrorCode.TRANSFER_NOT_PENDING);   // 신청한 뒤 담당이 이미 바뀐 경우
        }
        LocalDateTime now = LocalDateTime.now(clock);
        student.assignTeacher(teacherId, now);
        for (MessageThread thread : threadRepository.findByStudentId(student.getId())) {
            thread.reassignTeacher(teacherId);
        }
        request.accept(now);
        notificationService.transferAccepted(request.getFromTeacherId(), request.getId());
    }
}
