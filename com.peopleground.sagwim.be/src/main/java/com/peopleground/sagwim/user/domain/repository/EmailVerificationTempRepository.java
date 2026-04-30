package com.peopleground.sagwim.user.domain.repository;

import com.peopleground.sagwim.user.domain.entity.EmailVerificationTemp;
import java.util.Optional;

public interface EmailVerificationTempRepository {

    Optional<EmailVerificationTemp> findByEmail(String email);

    EmailVerificationTemp save(EmailVerificationTemp temp);

    void deleteByEmail(String email);
}
