package com.peopleground.sagwim.tag.presentation.controller;

import com.peopleground.sagwim.content.application.service.ContentService;
import com.peopleground.sagwim.content.presentation.dto.response.ContentResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.tag.application.service.TagService;
import com.peopleground.sagwim.tag.presentation.dto.response.TagResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/tags")
@Validated
public class TagController {

    private final TagService tagService;
    private final ContentService contentService;

    /**
     * 인기 태그 목록 조회 (상위 N개, postCount 내림차순)
     */
    @GetMapping
    public ResponseEntity<List<TagResponse>> getPopularTags() {
        List<TagResponse> res = tagService.getPopularTags();
        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    /**
     * 태그 자동완성 검색 (키워드 부분 일치)
     */
    @GetMapping("/search")
    public ResponseEntity<List<TagResponse>> searchTags(
        @RequestParam String q
    ) {
        List<TagResponse> res = tagService.searchTags(q);
        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    /**
     * 특정 태그의 게시글 목록 조회
     */
    @GetMapping("/{name}/contents")
    public ResponseEntity<PageResponse<ContentResponse>> getContentsByTagName(
        @PathVariable String name,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
        @AuthenticationPrincipal CustomUser user
    ) {
        PageResponse<ContentResponse> res = contentService.getContentsByTagName(name, page, size, user);
        return ResponseEntity.status(HttpStatus.OK).body(res);
    }
}
