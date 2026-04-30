package com.peopleground.sagwim.user.application.port;

/**
 * OAuth 제공자별 사용자 프로필의 공통 추상화.
 * KakaoOAuthClient / GoogleOAuthClient 가 이 인터페이스로 변환하여 반환한다.
 */
public record OAuthUserProfile(
    String providerId,
    String nickname,
    String email,
    String profileImageUrl
) {}
