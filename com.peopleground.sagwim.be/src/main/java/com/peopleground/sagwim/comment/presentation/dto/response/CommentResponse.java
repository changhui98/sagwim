package com.peopleground.sagwim.comment.presentation.dto.response;

import com.peopleground.sagwim.comment.domain.entity.Comment;
import java.time.LocalDateTime;
import java.util.List;

public record CommentResponse(
    Long id,
    String authorNickname,
    String body,
    int likeCount,
    boolean deleted,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<CommentResponse> replies
) {

    private static final String DELETED_BODY = "삭제된 댓글입니다.";

    /**
     * 최상위 댓글 변환 (대댓글 포함)
     */
    public static CommentResponse from(Comment comment, List<CommentResponse> replies) {
        boolean isDeleted = comment.isDeleted();
        return new CommentResponse(
            comment.getId(),
            isDeleted ? null : comment.getAuthor().getNickname(),
            isDeleted ? DELETED_BODY : comment.getBody(),
            isDeleted ? 0 : comment.getLikeCount(),
            isDeleted,
            comment.getCreatedDate(),
            comment.getLastModifiedDate(),
            replies
        );
    }

    /**
     * 대댓글 변환 (replies 없음)
     */
    public static CommentResponse from(Comment comment) {
        boolean isDeleted = comment.isDeleted();
        return new CommentResponse(
            comment.getId(),
            isDeleted ? null : comment.getAuthor().getNickname(),
            isDeleted ? DELETED_BODY : comment.getBody(),
            isDeleted ? 0 : comment.getLikeCount(),
            isDeleted,
            comment.getCreatedDate(),
            comment.getLastModifiedDate(),
            List.of()
        );
    }
}
