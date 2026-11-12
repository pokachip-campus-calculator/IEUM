package com.ieum.user.repository;

import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/** [역할] users 테이블 조회·저장 통로. loginId는 항상 소문자로 맞춰서 찾는다. */
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByLoginId(String loginId);

    Optional<User> findByLoginId(String loginId);

    // 내 담당 학습자(teacher_id=나, role=STUDENT)만. like는 "%"(전체) 또는 "%문구%"(닉네임 부분 일치, %·_ 이스케이프됨)
    @Query("select s from User s where s.teacherId = :teacherId and s.role = :role and s.nickname like :like escape '\\'")
    List<User> findStudentsByTeacher(@Param("teacherId") Long teacherId, @Param("role") Role role, @Param("like") String like);

    // 맡은 학습자 수가 적은 순, 같으면 id 작은 순으로 이음쌤을 늘어놓는다(자동 배정용)
    @Query("select t from User t where t.role = :role and t.status = :status "
            + "order by (select count(s) from User s where s.teacherId = t.id), t.id")
    List<User> findTeachersByLoad(@Param("role") Role role, @Param("status") UserStatus status, Pageable pageable);

    // 학습자를 가장 적게 맡은 활성 이음쌤 한 명(동률이면 id가 작은 쪽). 없으면 비어 있다
    default Optional<User> findLeastLoadedTeacher() {
        return findTeachersByLoad(Role.TEACHER, UserStatus.ACTIVE, PageRequest.of(0, 1)).stream().findFirst();
    }
}
