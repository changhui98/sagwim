package com.peopleground.sagwim.comment.application.service;

import com.peopleground.sagwim.comment.domain.CommentErrorCode;
import com.peopleground.sagwim.comment.domain.entity.Comment;
import com.peopleground.sagwim.comment.domain.repository.CommentRepository;
import com.peopleground.sagwim.comment.presentation.dto.request.CommentCreateRequest;
import com.peopleground.sagwim.comment.presentation.dto.request.CommentUpdateRequest;
import com.peopleground.sagwim.comment.presentation.dto.response.CommentListResponse;
import com.peopleground.sagwim.comment.presentation.dto.response.CommentResponse;
import com.peopleground.sagwim.content.domain.ContentErrorCode;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final ContentRepository contentRepository;
    private final UserRepository userRepository;

    /**
     * 게시글의 댓글 목록을 커서 기반 페이지네이션으로 조회한다.
     *
     * <p>N+1 방지 전략</p>
     * <ul>
     *   <li>최상위 댓글 조회 시 author 를 fetchJoin 하여 nickname 접근으로 인한 LAZY 로딩 제거.</li>
     *   <li>대댓글은 최상위 댓글 ID 목록으로 <b>단 한 번</b> 배치 조회한 뒤 parentId 로 그룹핑.</li>
     * </ul>
     *
     * <p>hasNext 판정 전략</p>
     * <ul>
     *   <li>size 만큼 딱 떨어지는 마지막 페이지 오판정을 피하기 위해 <code>size + 1</code> 을
     *       요청한 뒤 초과분을 trim 한다.</li>
     * </ul>
     */
    @Transactional(readOnly = true)
    public CommentListResponse getComments(Long contentId, Long cursorId, int size) {
        getActiveContent(contentId);

        List<Comment> fetched = commentRepository.findTopCommentsByContentId(contentId, cursorId, size + 1);

        boolean hasNext = fetched.size() > size;
        List<Comment> topComments = hasNext ? fetched.subList(0, size) : fetched;

        List<Long> parentIds = topComments.stream().map(Comment::getId).toList();
        Map<Long, List<Comment>> repliesByParent = commentRepository.findRepliesGroupedByParentIds(parentIds);

        List<CommentResponse> commentResponses = topComments.stream()
            .map(comment -> {
                List<CommentResponse> replies = repliesByParent
                    .getOrDefault(comment.getId(), List.of())
                    .stream()
                    .map(CommentResponse::from)
                    .toList();
                return CommentResponse.from(comment, replies);
            })
            .toList();

        return CommentListResponse.of(commentResponses, hasNext);
    }

    /**
     * 댓글을 작성한다. 게시글의 commentCount 를 원자적으로 증가시킨다.
     */
    @Transactional
    public CommentResponse createComment(Long contentId, CommentCreateRequest req, CustomUser customUser) {
        Content content = getActiveContent(contentId);
        User author = getUser(customUser);

        Comment comment = commentRepository.save(Comment.of(content, author, req.body()));
        contentRepository.incrementCommentCount(contentId);

        return CommentResponse.from(comment);
    }

    /**
     * 대댓글을 작성한다. 부모 댓글이 이미 대댓글이면 예외를 발생시킨다. (1 depth 제한)
     * 대댓글 작성도 게시글의 commentCount 를 원자적으로 증가시킨다.
     */
    @Transactional
    public CommentResponse createReply(Long contentId, Long parentCommentId, CommentCreateRequest req, CustomUser customUser) {
        Content content = getActiveContent(contentId);
        User author = getUser(customUser);

        Comment parentComment = commentRepository.findById(parentCommentId)
            .orElseThrow(() -> new AppException(CommentErrorCode.COMMENT_NOT_FOUND));

        if (parentComment.isDeleted()) {
            throw new AppException(CommentErrorCode.COMMENT_ALREADY_DELETED);
        }

        if (parentComment.isReply()) {
            throw new AppException(CommentErrorCode.COMMENT_REPLY_NOT_ALLOWED);
        }

        Comment reply = commentRepository.save(Comment.ofReply(content, parentComment, author, req.body()));
        contentRepository.incrementCommentCount(contentId);

        return CommentResponse.from(reply);
    }

    /**
     * 댓글을 수정한다. 본인만 수정 가능하다.
     */
    @Transactional
    public CommentResponse updateComment(Long contentId, Long commentId, CommentUpdateRequest req, CustomUser customUser) {
        getActiveContent(contentId);

        Comment comment = getActiveComment(commentId);
        validateCommentOwner(comment, customUser);

        comment.update(req.body());

        return CommentResponse.from(comment);
    }

    /**
     * 댓글을 소프트 삭제한다. 본인 또는 관리자만 삭제 가능하다.
     * 게시글의 commentCount 를 원자적으로 감소시킨다.
     */
    @Transactional
    public void deleteComment(Long contentId, Long commentId, CustomUser customUser) {
        getActiveContent(contentId);

        Comment comment = getActiveComment(commentId);
        validateCommentOwnerOrAdmin(comment, customUser);

        User user = getUser(customUser);
        comment.deleteBy(user);
        contentRepository.decrementCommentCount(contentId);
    }

    /**
     * 활성 게시글을 조회한다. 존재하지 않거나 <b>소프트 삭제된</b> 게시글 은 모두 404 처리한다.
     */
    private Content getActiveContent(Long contentId) {
        Content content = contentRepository.findById(contentId)
            .orElseThrow(() -> new AppException(ContentErrorCode.CONTENT_NOT_FOUND));
        if (content.isDeleted()) {
            throw new AppException(ContentErrorCode.CONTENT_NOT_FOUND);
        }
        return content;
    }

    private Comment getActiveComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new AppException(CommentErrorCode.COMMENT_NOT_FOUND));

        if (comment.isDeleted()) {
            throw new AppException(CommentErrorCode.COMMENT_ALREADY_DELETED);
        }

        return comment;
    }

    private void validateCommentOwner(Comment comment, CustomUser customUser) {
        if (!comment.getAuthor().getUsername().equals(customUser.getUsername())) {
            throw new AppException(CommentErrorCode.COMMENT_FORBIDDEN);
        }
    }

    private void validateCommentOwnerOrAdmin(Comment comment, CustomUser customUser) {
        boolean isOwner = comment.getAuthor().getUsername().equals(customUser.getUsername());
        boolean isAdmin = customUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AppException(CommentErrorCode.COMMENT_FORBIDDEN);
        }
    }

    private User getUser(CustomUser customUser) {
        return userRepository.findByUsername(customUser.getUsername())
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));
    }
}
