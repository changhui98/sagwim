package com.peopleground.sagwim.user.presentation.controller;

import com.peopleground.sagwim.global.security.jwt.JwtTokenProvider;
import com.peopleground.sagwim.user.application.AuthService;
import com.peopleground.sagwim.user.application.EmailVerificationService;
import com.peopleground.sagwim.user.presentation.dto.request.EmailResendRequest;
import com.peopleground.sagwim.user.presentation.dto.request.EmailVerifyRequest;
import com.peopleground.sagwim.user.presentation.dto.request.SendVerificationRequest;
import com.peopleground.sagwim.user.presentation.dto.request.UserCreateRequest;
import com.peopleground.sagwim.user.presentation.dto.response.UserCreateResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsername(
        @RequestParam String username
    ) {
        boolean available = authService.isUsernameAvailable(username);
        return ResponseEntity.ok(Map.of("available", available));
    }

    @PostMapping("/sign-up")
    public ResponseEntity<UserCreateResponse> signUp(
        @RequestBody @Valid UserCreateRequest request
    ) {
        UserCreateResponse res = authService.signUp(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PostMapping("/email/send-verification")
    public ResponseEntity<Map<String, String>> sendVerification(
        @RequestBody @Valid SendVerificationRequest request
    ) {
        emailVerificationService.sendVerificationBeforeSignUp(request.email());

        return ResponseEntity.ok(Map.of("message", "인증 코드가 발송되었습니다."));
    }

    @PostMapping("/email/verify")
    public ResponseEntity<Map<String, String>> verifyEmail(
        @RequestBody @Valid EmailVerifyRequest request
    ) {
        emailVerificationService.verifyCodeBeforeSignUp(request.email(), request.code());

        return ResponseEntity.ok(Map.of("message", "이메일 인증이 완료되었습니다."));
    }

    @PostMapping("/email/resend")
    public ResponseEntity<Map<String, String>> resendVerificationEmail(
        @RequestBody @Valid EmailResendRequest request
    ) {
        emailVerificationService.resendCode(request.email());

        return ResponseEntity.ok(Map.of("message", "인증코드가 재발송되었습니다."));
    }

    @PostMapping("/sign-out")
    public ResponseEntity<Void> signOut(HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        authService.signOut(token);
        return ResponseEntity.noContent().build();
    }

}
