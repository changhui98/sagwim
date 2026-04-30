package com.peopleground.sagwim.user.presentation.dto.response;

import com.peopleground.sagwim.user.domain.entity.User;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String username,
    String nickname,
    String userEmail,
    String address
) implements UserResponseMarker{

    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getNickname(),
            user.getUserEmail(),
            user.getAddress()
        );
    }

}
