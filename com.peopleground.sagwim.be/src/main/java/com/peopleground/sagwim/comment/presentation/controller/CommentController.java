package com.peopleground.sagwim.comment.presentation.controller;

import com.peopleground.sagwim.comment.application.service.CommentService;
import com.peopleground.sagwim.comment.presentation.dto.request.CommentCreateRequest;
import com.peopleground.sagwim.comment.presentation.dto.request.CommentUpdateRequest;
import com.peopleground.sagwim.comment.presentation.dto.response.CommentListResponse;
import com.peopleground.sagwim.comment.presentation.dto.response.CommentResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/contents/{contentId}/comments")
@Validated
public class CommentController {

    private final CommentService commentService;

    /**
     * 게시글 댓글 목록 조회 (커서 기반 페이지네이션, 비로그인 허용)
     */
    @GetMapping
    public ResponseEntity<CommentListResponse> getComments(
        @PathVariable Long contentId,
        @RequestParam(required = false) Long cursorId,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        CommentListResponse res = commentService.getComments(contentId, cursorId, size);
        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    /**
     * 댓글 작성 (로그인 필요)
     */
    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
        @PathVariable Long contentId,
        @Valid @RequestBody CommentCreateRequest req,
        @AuthenticationPrincipal CustomUser user
    ) {
        CommentResponse res = commentService.createComment(contentId, req, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    /**
     * 댓글 수정 (로그인 필요, 본인만 가능)
     */
    @PatchMapping("/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
        @PathVariable Long contentId,
        @PathVariable Long commentId,
        @Valid @RequestBody CommentUpdateRequest req,
        @AuthenticationPrincipal CustomUser user
    ) {
        CommentResponse res = commentService.updateComment(contentId, commentId, req, user);
        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    /**
     * 댓글 소프트 삭제 (로그인 필요, 본인 또는 관리자)
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
        @PathVariable Long contentId,
        @PathVariable Long commentId,
        @AuthenticationPrincipal CustomUser user
    ) {
        commentService.deleteComment(contentId, commentId, user);
        return ResponseEntity.noContent().build();
    }

    /**
     * 대댓글 작성 (로그인 필요)
     */
    @PostMapping("/{commentId}/replies")
    public ResponseEntity<CommentResponse> createReply(
        @PathVariable Long contentId,
        @PathVariable Long commentId,
        @Valid @RequestBody CommentCreateRequest req,
        @AuthenticationPrincipal CustomUser user
    ) {
        CommentResponse res = commentService.createReply(contentId, commentId, req, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }
}
