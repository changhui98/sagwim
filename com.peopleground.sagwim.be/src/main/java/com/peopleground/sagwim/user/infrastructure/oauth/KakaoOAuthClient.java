package com.peopleground.sagwim.user.infrastructure.oauth;

import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.application.port.OAuthClient;
import com.peopleground.sagwim.user.application.port.OAuthUserProfile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Slf4j
@Component("kakaoOAuthClient")
public class KakaoOAuthClient implements OAuthClient {

    @Value("${oauth2.kakao.client-id}")
    private String clientId;

    @Value("${oauth2.kakao.client-secret:}")
    private String clientSecret;

    private final WebClient authClient = WebClient.create("https://kauth.kakao.com");
    private final WebClient apiClient = WebClient.create("https://kapi.kakao.com");

    /**
     * 인가 코드로 카카오 액세스 토큰을 교환한다.
     */
    public String exchangeToken(String code, String redirectUri) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("redirect_uri", redirectUri);
        params.add("code", code);
        if (clientSecret != null && !clientSecret.isBlank()) {
            params.add("client_secret", clientSecret);
        }

        try {
            Map<?, ?> response = authClient.post()
                .uri("/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(params))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (response == null || !response.containsKey("access_token")) {
                throw new AppException(ApiErrorCode.EXTERNAL_API_ERROR);
            }

            return (String) response.get("access_token");
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("[KakaoOAuthClient] 토큰 교환 실패", e);
            throw new AppException(ApiErrorCode.EXTERNAL_API_ERROR);
        }
    }

    /**
     * 카카오 액세스 토큰으로 사용자 프로필을 조회한다.
     */
    public KakaoUserProfile getUserProfile(String accessToken) {
        try {
            return apiClient.get()
                .uri("/v2/user/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(KakaoUserProfile.class)
                .block();
        } catch (Exception e) {
            log.error("[KakaoOAuthClient] 프로필 조회 실패", e);
            throw new AppException(ApiErrorCode.EXTERNAL_API_ERROR);
        }
    }

    @Override
    public OAuthUserProfile fetchUserProfile(String accessToken) {
        KakaoUserProfile profile = getUserProfile(accessToken);
        String providerId = String.valueOf(profile.id());
        return new OAuthUserProfile(
            providerId,
            profile.nickname(),
            profile.email(),
            profile.profileImageUrl()
        );
    }
}
