package com.peopleground.sagwim.user.presentation.dto.response;

import com.peopleground.sagwim.user.domain.entity.OAuthProvider;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserDetailResponse(
    UUID id,
    String username,
    String nickname,
    String userEmail,
    UserRole role,
    OAuthProvider provider,
    String address,
    LocalDateTime createAt,
    LocalDateTime modifiedAt,
    boolean isDeleted,
    LocalDateTime deletedAt
) {
    public static AdminUserDetailResponse from(User user) {
        return new AdminUserDetailResponse(
            user.getId(),
            user.getUsername(),
            user.getNickname(),
            user.getUserEmail(),
            user.getRole(),
            user.getProvider(),
            user.getAddress(),
            user.getCreatedDate(),
            user.getLastModifiedDate(),
            user.isDeleted(),
            user.getDeletedDate()
        );
    }
}
