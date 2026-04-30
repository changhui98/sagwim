package com.peopleground.sagwim.user.presentation.controller;

import com.peopleground.sagwim.user.application.SocialAuthService;
import com.peopleground.sagwim.user.presentation.dto.request.SocialSignInRequest;
import com.peopleground.sagwim.user.presentation.dto.response.SocialSignInResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/social")
@RequiredArgsConstructor
public class SocialAuthController {

    private final SocialAuthService socialAuthService;

    /**
     * 소셜 로그인 (카카오 / 구글)
     * Authorization 헤더로 JWT 토큰을 반환한다.
     */
    @PostMapping("/sign-in")
    public ResponseEntity<SocialSignInResponse> socialSignIn(
        @RequestBody SocialSignInRequest request
    ) {
        SocialSignInResponse response = socialAuthService.socialSignIn(request);
        return ResponseEntity.ok()
            .header("Authorization", response.jwtToken())
            .body(response);
    }
}
