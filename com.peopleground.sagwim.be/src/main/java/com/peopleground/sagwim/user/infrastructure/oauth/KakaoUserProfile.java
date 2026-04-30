package com.peopleground.sagwim.user.infrastructure.oauth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 카카오 사용자 프로필 응답 DTO
 * GET https://kapi.kakao.com/v2/user/me
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record KakaoUserProfile(
    Long id,
    @JsonProperty("kakao_account") KakaoAccount kakaoAccount
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record KakaoAccount(
        String email,
        Profile profile
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Profile(
        String nickname,
        @JsonProperty("profile_image_url") String profileImageUrl
    ) {}

    public String nickname() {
        if (kakaoAccount != null && kakaoAccount.profile() != null) {
            return kakaoAccount.profile().nickname();
        }
        return "카카오사용자";
    }

    public String email() {
        if (kakaoAccount != null) {
            return kakaoAccount.email();
        }
        return null;
    }

    public String profileImageUrl() {
        if (kakaoAccount != null && kakaoAccount.profile() != null) {
            return kakaoAccount.profile().profileImageUrl();
        }
        return null;
    }
}
