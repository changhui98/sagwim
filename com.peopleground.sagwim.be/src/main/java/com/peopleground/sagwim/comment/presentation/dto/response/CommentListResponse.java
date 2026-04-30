package com.peopleground.sagwim.comment.presentation.dto.response;

import java.util.List;

public record CommentListResponse(
    List<CommentResponse> comments,
    Long nextCursorId,
    boolean hasNext
) {

    /**
     * 서비스 레이어에서 이미 <code>size + 1</code> 페칭 패턴으로 정확한 hasNext 를 계산했다고 가정하고,
     * 그 결과를 그대로 응답 DTO 로 변환한다.
     *
     * <p>과거에는 {@code comments.size() == requestedSize} 로 hasNext 를 추정했으나,
     * 마지막 페이지가 정확히 size 만큼일 때 true 로 오판정되는 문제가 있어 제거했다.</p>
     */
    public static CommentListResponse of(List<CommentResponse> comments, boolean hasNext) {
        Long nextCursorId = (hasNext && !comments.isEmpty()) ? comments.getLast().id() : null;
        return new CommentListResponse(comments, nextCursorId, hasNext);
    }
}
