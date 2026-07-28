package com.peopleground.sagwim.user.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.peopleground.sagwim.user.application.SocialAuthService;
import com.peopleground.sagwim.user.domain.EmailConflictException;
import com.peopleground.sagwim.user.presentation.dto.request.SocialLinkRequest;
import com.peopleground.sagwim.user.presentation.dto.request.SocialSignInRequest;
import com.peopleground.sagwim.user.presentation.dto.response.SocialSignInResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class SocialAuthControllerTest {

    @Mock SocialAuthService socialAuthService;
    @InjectMocks SocialAuthController controller;

    /** @Value 필드는 @InjectMocks 로 주입되지 않으므로 직접 채운다. */
    @BeforeEach
    void setUpCallbackUrl() {
        ReflectionTestUtils.setField(controller, "mobileOAuthCallbackUrl", "sagwim://oauth");
    }

    @Test
    @DisplayName("소셜 로그인 성공 - 200 OK + JWT 헤더 포함")
    void socialSignIn_success() {
        SocialSignInRequest req = new SocialSignInRequest("kakao", "authCode", "http://localhost/callback");
        SocialSignInResponse mockRes = new SocialSignInResponse("jwt.token.here", false, "닉네임");
        given(socialAuthService.socialSignIn(req)).willReturn(mockRes);

        ResponseEntity<?> res = controller.socialSignIn(req);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getHeaders().getFirst("Authorization")).isEqualTo("jwt.token.here");
    }

    @Test
    @DisplayName("소셜 로그인 - 이메일 충돌 시 409 Conflict")
    void socialSignIn_emailConflict() {
        SocialSignInRequest req = new SocialSignInRequest("google", "authCode", "http://localhost/callback");
        given(socialAuthService.socialSignIn(req))
            .willThrow(new EmailConflictException("access.token", "kakao"));

        ResponseEntity<?> res = controller.socialSignIn(req);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("소셜 계정 연동 성공 - 200 OK")
    void linkSocialAccount_success() {
        SocialLinkRequest req = new SocialLinkRequest("kakao", "access.token");
        SocialSignInResponse mockRes = new SocialSignInResponse("new.jwt.token", false, "닉네임");
        given(socialAuthService.linkSocialAccount(req)).willReturn(mockRes);

        ResponseEntity<SocialSignInResponse> res = controller.linkSocialAccount(req);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getHeaders().getFirst("Authorization")).isEqualTo("new.jwt.token");
    }

    @Test
    @DisplayName("소셜 계정 연동 - 서비스 예외 전파")
    void linkSocialAccount_serviceThrows() {
        SocialLinkRequest req = new SocialLinkRequest("kakao", "invalid.token");
        given(socialAuthService.linkSocialAccount(req))
            .willThrow(new RuntimeException("연동 실패"));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> controller.linkSocialAccount(req))
            .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("모바일 브릿지 콜백 - code/state 를 앱 스킴으로 302 전달")
    void mobileOAuthCallback_success() {
        ResponseEntity<Void> res = controller.mobileOAuthCallback("authCode", "KAKAO", null, null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FOUND);
        assertThat(res.getHeaders().getLocation())
            .hasToString("sagwim://oauth?code=authCode&state=KAKAO");
    }

    @Test
    @DisplayName("모바일 브릿지 콜백 - 사용자 취소 시 error 파라미터 전달")
    void mobileOAuthCallback_error() {
        ResponseEntity<Void> res = controller.mobileOAuthCallback(
            null, null, "access_denied", "user denied");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FOUND);
        assertThat(res.getHeaders().getLocation())
            .hasToString("sagwim://oauth?error=access_denied&error_description=user+denied");
    }

    @Test
    @DisplayName("모바일 브릿지 콜백 - 파라미터가 없으면 스킴만 반환")
    void mobileOAuthCallback_noParams() {
        ResponseEntity<Void> res = controller.mobileOAuthCallback(null, null, null, null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FOUND);
        assertThat(res.getHeaders().getLocation()).hasToString("sagwim://oauth");
    }

    /**
     * 커스텀 스킴이 실제 HTTP 응답의 Location 헤더로 온전히 직렬화되는지 확인한다.
     * 메서드 직접 호출 테스트로는 Spring MVC 의 헤더 기록 단계를 검증할 수 없다.
     */
    @Test
    @DisplayName("모바일 브릿지 콜백 - HTTP 레벨에서 커스텀 스킴 Location 헤더 직렬화")
    void mobileOAuthCallback_httpLocationHeader() throws Exception {
        MockMvcBuilders.standaloneSetup(controller).build()
            .perform(get("/api/v1/auth/social/callback")
                .param("code", "authCode")
                .param("state", "KAKAO"))
            .andExpect(status().isFound())
            .andExpect(header().string("Location", "sagwim://oauth?code=authCode&state=KAKAO"));
    }
}
