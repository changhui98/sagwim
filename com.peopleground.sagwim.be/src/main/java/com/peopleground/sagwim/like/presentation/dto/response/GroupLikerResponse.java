package com.peopleground.sagwim.like.presentation.dto.response;

import com.peopleground.sagwim.user.domain.entity.User;

public record GroupLikerResponse(
    String username,
    String nickname,
    String profileImageUrl
) {

    public static GroupLikerResponse from(User user) {
        return from(user, user.getProfileImageUrl());
    }

    public static GroupLikerResponse from(User user, String resolvedProfileImageUrl) {
        return new GroupLikerResponse(
            user.getUsername(),
            user.getNickname(),
            resolvedProfileImageUrl
        );
    }
}
