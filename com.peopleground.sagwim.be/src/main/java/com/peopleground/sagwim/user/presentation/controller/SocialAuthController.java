package com.peopleground.sagwim.user.presentation.controller;

import com.peopleground.sagwim.user.application.SocialAuthService;
import com.peopleground.sagwim.user.domain.EmailConflictException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.presentation.dto.request.SocialLinkRequest;
import com.peopleground.sagwim.user.presentation.dto.request.SocialSignInRequest;
import com.peopleground.sagwim.user.presentation.dto.response.EmailConflictResponse;
import com.peopleground.sagwim.user.presentation.dto.response.SocialSignInResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/auth/social")
@RequiredArgsConstructor
public class SocialAuthController {

    private final SocialAuthService socialAuthService;

    /**
     * 모바일 앱으로 되돌아갈 커스텀 스킴 URL.
     * 클라이언트 입력이 아니라 이 서버 설정값만 리다이렉트 대상으로 사용한다 (open redirect 방지).
     */
    @Value("${app.mobile.oauth-callback-url:sagwim://oauth}")
    private String mobileOAuthCallbackUrl;

    /**
     * 소셜 로그인 (카카오 / 구글)
     * Authorization 헤더로 JWT 토큰을 반환한다.
     * 동일 이메일로 가입된 계정이 있으면 409 Conflict를 반환하며,
     * 바디에 sign-in 단계에서 교환한 accessToken과 provider를 포함한다.
     * 프론트엔드는 이를 보관했다가 /link 호출 시 재사용하여 code 재사용(invalid_grant)을 방지한다.
     */
    @PostMapping("/sign-in")
    public ResponseEntity<?> socialSignIn(
        @RequestBody SocialSignInRequest request
    ) {
        try {
            SocialSignInResponse response = socialAuthService.socialSignIn(request);
            return ResponseEntity.ok()
                .header("Authorization", response.jwtToken())
                .body(response);
        } catch (EmailConflictException e) {
            UserErrorCode errorCode = UserErrorCode.EMAIL_ALREADY_EXISTS_WITH_DIFFERENT_PROVIDER;
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new EmailConflictResponse(
                    errorCode.getCode(),
                    errorCode.getMessage(),
                    e.getAccessToken(),
                    e.getProvider()
                ));
        }
    }

    /**
     * 소셜 계정 연동
     * 409 응답 후 사용자 동의를 받아 기존 계정에 소셜 provider를 연동하고 JWT를 발급한다.
     * code 대신 409 바디에서 받은 accessToken을 그대로 전달한다.
     */
    @PostMapping("/link")
    public ResponseEntity<SocialSignInResponse> linkSocialAccount(
        @RequestBody SocialLinkRequest request
    ) {
        SocialSignInResponse response = socialAuthService.linkSocialAccount(request);
        return ResponseEntity.ok()
            .header("Authorization", response.jwtToken())
            .body(response);
    }

    /**
     * 모바일 앱용 OAuth 브릿지 콜백.
     *
     * <p>웹은 {@code https://sagwim.com/login} 같은 자기 자신을 redirect_uri 로 쓸 수 있지만,
     * 앱의 도착지는 커스텀 스킴({@code sagwim://oauth})이라 구글 web 클라이언트에 등록할 수 없다
     * (구글은 redirect URI 에 https 를 요구하며 localhost 만 예외로 둔다).
     * 그래서 provider 에는 이 https 엔드포인트를 redirect_uri 로 등록하고,
     * 여기서 302 로 앱 스킴에 code 를 실어 되돌려준다.</p>
     *
     * <p>이 메서드는 <b>토큰 교환을 하지 않는다</b>. 서버 상태를 만들지 않는 stateless 리다이렉트이며,
     * 실제 교환은 앱이 받은 code 로 {@code POST /sign-in} 을 호출할 때 수행된다.
     * 이때 앱이 함께 보내는 redirectUri 는 provider 에 등록된 이 엔드포인트 URL 과 동일해야 한다.</p>
     *
     * <p>사용자가 동의를 취소하면 provider 는 code 대신 {@code error=access_denied} 로 이 URL 을
     * 호출하므로, 오류 파라미터도 앱까지 그대로 전달한다.</p>
     */
    @GetMapping("/callback")
    public ResponseEntity<Void> mobileOAuthCallback(
        @RequestParam(required = false) String code,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String error,
        @RequestParam(name = "error_description", required = false) String errorDescription
    ) {
        List<String> params = new ArrayList<>();
        appendParam(params, "code", code);
        appendParam(params, "state", state);
        appendParam(params, "error", error);
        appendParam(params, "error_description", errorDescription);

        String target = params.isEmpty()
            ? mobileOAuthCallbackUrl
            : mobileOAuthCallbackUrl + "?" + String.join("&", params);

        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(target))
            .build();
    }

    private void appendParam(List<String> params, String name, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        params.add(name + "=" + URLEncoder.encode(value, StandardCharsets.UTF_8));
    }
}
