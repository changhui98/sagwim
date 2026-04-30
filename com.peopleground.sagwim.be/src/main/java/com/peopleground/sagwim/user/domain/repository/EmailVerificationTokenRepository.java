package com.peopleground.sagwim.user.domain.repository;

import com.peopleground.sagwim.user.domain.entity.EmailVerificationToken;
import com.peopleground.sagwim.user.domain.entity.User;
import java.util.Optional;

public interface EmailVerificationTokenRepository {

    Optional<EmailVerificationToken> findByUserEmail(String email);

    void deleteByUser(User user);

    EmailVerificationToken save(EmailVerificationToken token);
}
