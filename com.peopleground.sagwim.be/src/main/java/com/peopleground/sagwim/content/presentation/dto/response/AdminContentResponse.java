package com.peopleground.sagwim.content.presentation.dto.response;

import com.peopleground.sagwim.content.domain.entity.Content;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminContentResponse(
    Long id,
    String body,
    UUID userId,
    String createdBy,
    LocalDateTime createdDate,
    String lastModifiedBy,
    LocalDateTime lastModifiedDate,
    String deletedBy,
    LocalDateTime deletedDate
) {
    public static AdminContentResponse from(Content content) {
        return new AdminContentResponse(
            content.getId(),
            content.getBody(),
            content.getUser().getId(),
            content.getCreatedBy(),
            content.getCreatedDate(),
            content.getLastModifiedBy(),
            content.getLastModifiedDate(),
            content.getDeletedBy(),
            content.getDeletedDate()
        );
    }
}
