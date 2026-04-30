package com.peopleground.sagwim.user.infrastructure.oauth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 구글 사용자 프로필 응답 DTO
 * GET https://www.googleapis.com/oauth2/v3/userinfo
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GoogleUserProfile(
    String sub,
    String name,
    String email,
    String picture,
    @JsonProperty("email_verified") boolean emailVerified
) {}
