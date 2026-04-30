package com.peopleground.sagwim.user.presentation.dto.response;

public record SocialSignInResponse(
    String jwtToken,
    boolean isNewUser,
    String nickname
) {}
