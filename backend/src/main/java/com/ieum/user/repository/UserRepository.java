package com.ieum.user.repository;

import com.ieum.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

/** [역할] users 테이블 조회·저장 통로. */
public interface UserRepository extends JpaRepository<User, Long> {
}
