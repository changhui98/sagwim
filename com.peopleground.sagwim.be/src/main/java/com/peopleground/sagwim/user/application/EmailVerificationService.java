package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.EmailVerificationTemp;
import com.peopleground.sagwim.user.domain.entity.EmailVerificationToken;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.EmailVerificationTempRepository;
import com.peopleground.sagwim.user.domain.repository.EmailVerificationTokenRepository;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final EmailVerificationTempRepository emailVerificationTempRepository;
    private final UserRepository userRepository;
    private final EmailSender emailSender;

    @Transactional
    public void sendVerificationEmail(String userEmail) {

        User user = userRepository.findByUserEmail(userEmail).orElseThrow(
            () -> new AppException(UserErrorCode.USER_NOT_FOUND)
        );

        if (user.isEmailVerified()) {
            throw new AppException(UserErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        String code = String.format("%06d", SECURE_RANDOM.nextInt(1000000));

        emailVerificationTokenRepository.findByUserEmail(userEmail)
            .ifPresent(token -> emailVerificationTokenRepository.deleteByUser(user));

        EmailVerificationToken token = EmailVerificationToken.of(user, code);
        emailVerificationTokenRepository.save(token);

        emailSender.sendVerificationEmail(userEmail, code);
    }

    @Transactional
    public void verifyCode(String userEmail, String code) {

        EmailVerificationToken token = emailVerificationTokenRepository.findByUserEmail(userEmail)
            .orElseThrow(() -> new AppException(UserErrorCode.INVALID_VERIFICATION_CODE));

        // User를 1회만 조회하여 만료/검증/처리에 재사용
        User user = userRepository.findByUserEmail(userEmail).orElseThrow(
            () -> new AppException(UserErrorCode.USER_NOT_FOUND)
        );

        if (token.isExpired()) {
            emailVerificationTokenRepository.deleteByUser(user);
            throw new AppException(UserErrorCode.INVALID_VERIFICATION_CODE);
        }

        if (!token.getCode().equals(code)) {
            throw new AppException(UserErrorCode.INVALID_VERIFICATION_CODE);
        }

        user.verifyEmail();
        emailVerificationTokenRepository.deleteByUser(user);
    }

    @Transactional
    public void sendVerificationBeforeSignUp(String email) {

        if (userRepository.existsByUserEmail(email)) {
            throw new AppException(UserErrorCode.DUPLICATE_EMAIL);
        }

        Optional<EmailVerificationTemp> existing = emailVerificationTempRepository.findByEmail(email);

        if (existing.isPresent()) {
            LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);
            if (existing.get().getCreatedAt().isAfter(oneMinuteAgo)) {
                throw new AppException(UserErrorCode.VERIFICATION_CODE_RESEND_TOO_SOON);
            }
            emailVerificationTempRepository.deleteByEmail(email);
        }

        String code = String.format("%06d", SECURE_RANDOM.nextInt(1000000));
        EmailVerificationTemp temp = EmailVerificationTemp.of(email, code);
        emailVerificationTempRepository.save(temp);

        emailSender.sendVerificationEmail(email, code);
    }

    @Transactional
    public void verifyCodeBeforeSignUp(String email, String code) {

        EmailVerificationTemp temp = emailVerificationTempRepository.findByEmail(email)
            .orElseThrow(() -> new AppException(UserErrorCode.INVALID_VERIFICATION_CODE));

        if (temp.isExpired()) {
            emailVerificationTempRepository.deleteByEmail(email);
            throw new AppException(UserErrorCode.INVALID_VERIFICATION_CODE);
        }

        if (!temp.getCode().equals(code)) {
            throw new AppException(UserErrorCode.INVALID_VERIFICATION_CODE);
        }

        temp.markVerified();
        emailVerificationTempRepository.save(temp);
    }

    public void checkPreVerified(String email) {
        EmailVerificationTemp temp = emailVerificationTempRepository.findByEmail(email)
            .orElseThrow(() -> new AppException(UserErrorCode.EMAIL_NOT_PRE_VERIFIED));

        if (!temp.isVerified()) {
            throw new AppException(UserErrorCode.EMAIL_NOT_PRE_VERIFIED);
        }
    }

    @Transactional
    public void deletePreVerification(String email) {
        emailVerificationTempRepository.deleteByEmail(email);
    }

    @Transactional
    public void resendCode(String email) {
        sendVerificationBeforeSignUp(email);
    }
}
