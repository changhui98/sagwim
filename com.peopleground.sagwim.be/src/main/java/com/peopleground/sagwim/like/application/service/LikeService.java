package com.peopleground.sagwim.like.application.service;

import com.peopleground.sagwim.comment.domain.CommentErrorCode;
import com.peopleground.sagwim.comment.domain.entity.Comment;
import com.peopleground.sagwim.comment.domain.repository.CommentRepository;
import com.peopleground.sagwim.content.domain.ContentErrorCode;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.GroupErrorCode;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.image.application.ImageUrlResolver;
import com.peopleground.sagwim.like.domain.entity.ContentLike;
import com.peopleground.sagwim.like.domain.entity.GroupLike;
import com.peopleground.sagwim.like.domain.repository.CommentLikeRepository;
import com.peopleground.sagwim.like.domain.repository.ContentLikeRepository;
import com.peopleground.sagwim.like.domain.repository.GroupLikeRepository;
import com.peopleground.sagwim.like.presentation.dto.response.GroupLikerResponse;
import com.peopleground.sagwim.like.presentation.dto.response.LikeStatusResponse;
import com.peopleground.sagwim.like.presentation.dto.response.LikeToggleResponse;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final ContentLikeRepository contentLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final GroupLikeRepository groupLikeRepository;
    private final ContentRepository contentRepository;
    private final CommentRepository commentRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final ImageUrlResolver imageUrlResolver;

    /**
     * 게시글 좋아요 토글.
     *
     * <p>동시성 전략</p>
     * <ul>
     *   <li>좋아요 추가: <code>INSERT ... ON CONFLICT DO NOTHING</code> 으로 UNIQUE 경합을
     *       예외 없이 처리한다. 실제 삽입 행이 1 인 경우에만 likeCount 를 원자 UPDATE 로 증가시킨다.</li>
     *   <li>좋아요 취소: DELETE 후 원자 UPDATE 로 감소. 0 미만으로는 내려가지 않는다.</li>
     *   <li>다중 사용자 동시 좋아요에서도 likeCount 의 Lost Update 를 방지한다.</li>
     * </ul>
     */
    @CacheEvict(value = "contentLikeCount", key = "#contentId")
    @Transactional
    public LikeToggleResponse toggleContentLike(Long contentId, CustomUser customUser) {
        Content content = contentRepository.findById(contentId)
            .orElseThrow(() -> new AppException(ContentErrorCode.CONTENT_NOT_FOUND));

        User user = getUser(customUser);

        Optional<ContentLike> existingLike = contentLikeRepository.findByContentIdAndUserId(contentId, user.getId());

        if (existingLike.isPresent()) {
            contentLikeRepository.delete(existingLike.get());
            contentRepository.decrementLikeCount(contentId);
            return LikeToggleResponse.unliked(currentContentLikeCount(contentId));
        }

        int inserted = contentLikeRepository.insertIfNotExists(content.getId(), user.getId());
        if (inserted == 1) {
            contentRepository.incrementLikeCount(contentId);
        }
        return LikeToggleResponse.liked(currentContentLikeCount(contentId));
    }

    /**
     * 댓글 좋아요 토글. 전략은 게시글 토글과 동일하다. (ON CONFLICT DO NOTHING + 원자 UPDATE)
     */
    @CacheEvict(value = "commentLikeCount", key = "#commentId")
    @Transactional
    public LikeToggleResponse toggleCommentLike(Long commentId, CustomUser customUser) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new AppException(CommentErrorCode.COMMENT_NOT_FOUND));

        if (comment.isDeleted()) {
            throw new AppException(CommentErrorCode.COMMENT_ALREADY_DELETED);
        }

        User user = getUser(customUser);

        Optional<com.peopleground.sagwim.like.domain.entity.CommentLike> existingLike =
            commentLikeRepository.findByCommentIdAndUserId(commentId, user.getId());

        if (existingLike.isPresent()) {
            commentLikeRepository.delete(existingLike.get());
            commentRepository.decrementLikeCount(commentId);
            return LikeToggleResponse.unliked(currentCommentLikeCount(commentId));
        }

        int inserted = commentLikeRepository.insertIfNotExists(commentId, user.getId());
        if (inserted == 1) {
            commentRepository.incrementLikeCount(commentId);
        }
        return LikeToggleResponse.liked(currentCommentLikeCount(commentId));
    }

    /**
     * 내 게시글 좋아요 여부 확인
     */
    @Transactional(readOnly = true)
    public LikeStatusResponse getContentLikeStatus(Long contentId, CustomUser customUser) {
        User user = getUser(customUser);
        boolean liked = contentLikeRepository.existsByContentIdAndUserId(contentId, user.getId());
        return LikeStatusResponse.of(liked);
    }

    /**
     * 내 댓글 좋아요 여부 확인
     */
    @Transactional(readOnly = true)
    public LikeStatusResponse getCommentLikeStatus(Long commentId, CustomUser customUser) {
        User user = getUser(customUser);
        boolean liked = commentLikeRepository.existsByCommentIdAndUserId(commentId, user.getId());
        return LikeStatusResponse.of(liked);
    }

    /**
     * 모임 좋아요 토글.
     *
     * <p>동시성 전략은 게시글 좋아요 토글과 동일하다.
     * INSERT ... ON CONFLICT DO NOTHING + 원자 UPDATE 로 Lost Update 를 방지한다.</p>
     */
    @Transactional
    public LikeToggleResponse toggleGroupLike(Long groupId, CustomUser customUser) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_FOUND));

        User user = getUser(customUser);

        Optional<GroupLike> existingLike = groupLikeRepository.findByGroupIdAndUserId(groupId, user.getId());

        if (existingLike.isPresent()) {
            groupLikeRepository.delete(existingLike.get());
            groupRepository.decrementLikeCount(groupId);
            return LikeToggleResponse.unliked(currentGroupLikeCount(groupId));
        }

        int inserted = groupLikeRepository.insertIfNotExists(group.getId(), user.getId());
        if (inserted == 1) {
            groupRepository.incrementLikeCount(groupId);
        }
        return LikeToggleResponse.liked(currentGroupLikeCount(groupId));
    }

    /**
     * 내 모임 좋아요 여부 확인
     */
    @Transactional(readOnly = true)
    public LikeStatusResponse getGroupLikeStatus(Long groupId, CustomUser customUser) {
        User user = getUser(customUser);
        boolean liked = groupLikeRepository.existsByGroupIdAndUserId(groupId, user.getId());
        return LikeStatusResponse.of(liked);
    }

    /**
     * 모임 좋아요한 사용자 목록 조회
     */
    @Transactional(readOnly = true)
    public List<GroupLikerResponse> getGroupLikers(Long groupId) {
        groupRepository.findById(groupId)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_FOUND));
        return groupLikeRepository.findByGroupId(groupId)
            .stream()
            .map(gl -> GroupLikerResponse.from(
                gl.getUser(),
                imageUrlResolver.resolve(gl.getUser().getProfileImageUrl())
            ))
            .toList();
    }

    private User getUser(CustomUser customUser) {
        return userRepository.findByUsername(customUser.getUsername())
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));
    }

    private int currentContentLikeCount(Long contentId) {
        Integer value = contentRepository.findLikeCountById(contentId);
        return value != null ? value : 0;
    }

    private int currentCommentLikeCount(Long commentId) {
        Integer value = commentRepository.findLikeCountById(commentId);
        return value != null ? value : 0;
    }

    private int currentGroupLikeCount(Long groupId) {
        Integer value = groupRepository.findLikeCountById(groupId);
        return value != null ? value : 0;
    }
}
