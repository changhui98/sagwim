package com.peopleground.sagwim.content.presentation.dto.response;

import com.peopleground.sagwim.content.domain.entity.Content;
import java.time.LocalDateTime;
import java.util.List;

public record ContentResponse(
    Long id,
    String body,
    String createdBy,
    String nickname,
    LocalDateTime createdAt,
    int likeCount,
    int commentCount,
    boolean likedByMe,
    List<String> tags,
    List<String> imageUrls
) {
    public static ContentResponse from(Content content) {
        return from(content, null, false, List.of(), List.of());
    }

    public static ContentResponse from(
        Content content,
        String nickname,
        boolean likedByMe,
        List<String> tags,
        List<String> imageUrls
    ) {
        return new ContentResponse(
            content.getId(),
            content.getBody(),
            content.getCreatedBy(),
            nickname,
            content.getCreatedDate(),
            content.getLikeCount(),
            content.getCommentCount(),
            likedByMe,
            tags == null ? List.of() : List.copyOf(tags),
            imageUrls == null ? List.of() : List.copyOf(imageUrls)
        );
    }
}
