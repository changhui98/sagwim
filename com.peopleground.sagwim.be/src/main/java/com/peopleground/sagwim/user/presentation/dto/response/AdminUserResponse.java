package com.peopleground.sagwim.user.presentation.dto.response;

import com.peopleground.sagwim.user.domain.entity.OAuthProvider;
import com.peopleground.sagwim.user.domain.entity.User;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserResponse(
    UUID id,
    String username,
    String nickname,
    String userEmail,
    String address,
    String profileImageUrl,
    OAuthProvider provider,
    boolean isDeleted,
    LocalDateTime createdDate,
    LocalDateTime modifiedDate
) implements UserResponseMarker{

    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
            user.getId(),
            user.getUsername(),
            user.getNickname(),
            user.getUserEmail(),
            user.getAddress(),
            user.getProfileImageUrl(),
            user.getProvider(),
            user.isDeleted(),
            user.getCreatedDate(),
            user.getLastModifiedDate()
        );
    }

}
