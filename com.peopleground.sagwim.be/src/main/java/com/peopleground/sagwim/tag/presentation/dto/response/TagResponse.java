package com.peopleground.sagwim.tag.presentation.dto.response;

import com.peopleground.sagwim.tag.domain.entity.Tag;

public record TagResponse(
    Long id,
    String name,
    int postCount
) {
    public static TagResponse from(Tag tag) {
        return new TagResponse(
            tag.getId(),
            tag.getName(),
            tag.getPostCount()
        );
    }
}
