package com.peopleground.sagwim.like.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.like.application.service.LikeService;
import com.peopleground.sagwim.like.presentation.dto.response.LikeStatusResponse;
import com.peopleground.sagwim.like.presentation.dto.response.LikeToggleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/comments/{commentId}/likes")
public class CommentLikeController {

    private final LikeService likeService;

    /**
     * 댓글 좋아요 토글 (로그인 필요)
     */
    @PostMapping
    public ResponseEntity<LikeToggleResponse> toggleCommentLike(
        @PathVariable Long commentId,
        @AuthenticationPrincipal CustomUser user
    ) {
        LikeToggleResponse res = likeService.toggleCommentLike(commentId, user);
        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    /**
     * 내 댓글 좋아요 여부 확인 (로그인 필요)
     */
    @GetMapping("/me")
    public ResponseEntity<LikeStatusResponse> getCommentLikeStatus(
        @PathVariable Long commentId,
        @AuthenticationPrincipal CustomUser user
    ) {
        LikeStatusResponse res = likeService.getCommentLikeStatus(commentId, user);
        return ResponseEntity.status(HttpStatus.OK).body(res);
    }
}
