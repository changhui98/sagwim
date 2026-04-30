package com.peopleground.sagwim.like.presentation.dto.response;

public record LikeStatusResponse(
    boolean liked
) {
    public static LikeStatusResponse of(boolean liked) {
        return new LikeStatusResponse(liked);
    }
}
