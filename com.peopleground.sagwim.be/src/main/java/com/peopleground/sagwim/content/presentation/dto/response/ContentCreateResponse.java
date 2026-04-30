package com.peopleground.sagwim.content.presentation.dto.response;

import com.peopleground.sagwim.content.domain.entity.Content;
import java.time.LocalDateTime;

public record ContentCreateResponse(
    Long id,
    String body,
    String createdBy,
    LocalDateTime createdAt,
    String updatedBy,
    LocalDateTime updatedAt
) {
    public static ContentCreateResponse from(Content content) {

        return new ContentCreateResponse(
            content.getId(),
            content.getBody(),
            content.getUser().getUsername(),
            content.getCreatedDate(),
            content.getUser().getUsername(),
            content.getLastModifiedDate()
        );
    }

}
