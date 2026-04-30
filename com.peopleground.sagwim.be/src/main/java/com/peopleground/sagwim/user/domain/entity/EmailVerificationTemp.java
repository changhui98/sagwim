package com.peopleground.sagwim.user.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "email_verification_temp")
public class EmailVerificationTemp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean verified = false;

    public static EmailVerificationTemp of(String email, String code) {
        EmailVerificationTemp temp = new EmailVerificationTemp();
        temp.email = email;
        temp.code = code;
        temp.createdAt = LocalDateTime.now();
        temp.expiresAt = LocalDateTime.now().plusMinutes(5);
        temp.verified = false;
        return temp;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }

    public void markVerified() {
        this.verified = true;
    }
}
