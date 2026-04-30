package com.peopleground.sagwim.user.infrastructure.repository;

import com.peopleground.sagwim.user.domain.entity.EmailVerificationTemp;
import com.peopleground.sagwim.user.domain.repository.EmailVerificationTempRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EmailVerificationTempRepositoryImpl implements EmailVerificationTempRepository {

    private final EmailVerificationTempJpaRepository emailVerificationTempJpaRepository;

    @Override
    public Optional<EmailVerificationTemp> findByEmail(String email) {
        return emailVerificationTempJpaRepository.findByEmail(email);
    }

    @Override
    public EmailVerificationTemp save(EmailVerificationTemp temp) {
        return emailVerificationTempJpaRepository.save(temp);
    }

    @Override
    public void deleteByEmail(String email) {
        emailVerificationTempJpaRepository.deleteByEmail(email);
    }
}
