package com.peopleground.sagwim.user.application.port;

/**
 * OAuth 제공자 연동 포트.
 * KakaoOAuthClient, GoogleOAuthClient 가 이 인터페이스를 구현한다.
 */
public interface OAuthClient {

    /**
     * 인가 코드를 액세스 토큰으로 교환한다.
     */
    String exchangeToken(String code, String redirectUri);

    /**
     * 액세스 토큰으로 사용자 프로필을 조회하여 공통 DTO로 반환한다.
     */
    OAuthUserProfile fetchUserProfile(String accessToken);
}
