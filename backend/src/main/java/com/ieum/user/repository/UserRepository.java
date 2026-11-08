package com.ieum.user.repository;

import com.ieum.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/** [역할] users 테이블 조회·저장 통로. loginId는 항상 소문자로 맞춰서 찾는다. */
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByLoginId(String loginId);

    Optional<User> findByLoginId(String loginId);
}
