package com.peopleground.sagwim.user.infrastructure.repository;

import com.peopleground.sagwim.user.domain.entity.EmailVerificationTemp;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTempJpaRepository
    extends JpaRepository<EmailVerificationTemp, UUID> {

    Optional<EmailVerificationTemp> findByEmail(String email);

    void deleteByEmail(String email);
}
