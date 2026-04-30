package com.peopleground.sagwim.user.infrastructure;

import com.peopleground.sagwim.user.application.EmailSender;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SmtpEmailSender implements EmailSender {

    private final JavaMailSender javaMailSender;

    @Override
    public void sendVerificationEmail(String toEmail, String code) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("[moida] 이메일 인증 코드");
        message.setText("안녕하세요.\n\n이메일 인증 코드: " + code + "\n\n코드는 5분간 유효합니다.");

        javaMailSender.send(message);
    }
}
