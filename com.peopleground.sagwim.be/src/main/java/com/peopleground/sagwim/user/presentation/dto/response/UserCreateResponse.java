package com.peopleground.sagwim.user.presentation.dto.response;

import com.peopleground.sagwim.user.domain.entity.User;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserCreateResponse(
    UUID id,
    String username,
    LocalDateTime createdAt
) {
    public static UserCreateResponse from(User user) {
        return new UserCreateResponse(
            user.getId(),
            user.getUsername(),
            user.getCreatedDate()
        );
    }

}
