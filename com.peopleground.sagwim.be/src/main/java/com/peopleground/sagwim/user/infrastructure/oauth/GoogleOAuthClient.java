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

import java.util.Map;

@Slf4j
@Component("googleOAuthClient")
public class GoogleOAuthClient implements OAuthClient {

    @Value("${oauth2.google.client-id}")
    private String clientId;

    @Value("${oauth2.google.client-secret}")
    private String clientSecret;

    private final WebClient tokenClient = WebClient.create("https://oauth2.googleapis.com");
    private final WebClient apiClient = WebClient.create("https://www.googleapis.com");

    /**
     * 인가 코드로 구글 액세스 토큰을 교환한다.
     */
    public String exchangeToken(String code, String redirectUri) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        try {
            Map<?, ?> response = tokenClient.post()
                .uri("/token")
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
            log.error("[GoogleOAuthClient] 토큰 교환 실패", e);
            throw new AppException(ApiErrorCode.EXTERNAL_API_ERROR);
        }
    }

    /**
     * 구글 액세스 토큰으로 사용자 프로필을 조회한다.
     */
    public GoogleUserProfile getUserProfile(String accessToken) {
        try {
            return apiClient.get()
                .uri("/oauth2/v3/userinfo")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(GoogleUserProfile.class)
                .block();
        } catch (Exception e) {
            log.error("[GoogleOAuthClient] 프로필 조회 실패", e);
            throw new AppException(ApiErrorCode.EXTERNAL_API_ERROR);
        }
    }

    @Override
    public OAuthUserProfile fetchUserProfile(String accessToken) {
        GoogleUserProfile profile = getUserProfile(accessToken);
        return new OAuthUserProfile(
            profile.sub(),
            profile.name() != null ? profile.name() : "구글사용자",
            profile.email(),
            profile.picture()
        );
    }
}
