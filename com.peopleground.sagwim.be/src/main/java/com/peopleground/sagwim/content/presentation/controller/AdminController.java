package com.peopleground.sagwim.content.presentation.controller;

import com.peopleground.sagwim.content.application.service.AdminService;
import com.peopleground.sagwim.content.presentation.dto.request.AdminContentUpdateRequest;
import com.peopleground.sagwim.content.presentation.dto.request.SearchType;
import com.peopleground.sagwim.content.presentation.dto.response.AdminContentResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController("contentAdminController")
@RequestMapping("/api/v1/admin/contents")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<AdminContentResponse>> getAllContents(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false, defaultValue = "TITLE") SearchType searchType
    ) {
        return ResponseEntity.status(HttpStatus.OK).body(adminService.getAllContents(page, size, keyword, searchType));
    }

    @GetMapping("/{contentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminContentResponse> getContent(@PathVariable Long contentId) {
        return ResponseEntity.status(HttpStatus.OK).body(adminService.getContent(contentId));
    }

    @PatchMapping("/{contentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminContentResponse> updateContent(
        @PathVariable Long contentId,
        @RequestBody @Valid AdminContentUpdateRequest req
    ) {
        return ResponseEntity.status(HttpStatus.OK).body(adminService.updateContent(contentId, req));
    }

    @DeleteMapping("/{contentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteContent(
        @PathVariable Long contentId,
        @AuthenticationPrincipal CustomUser adminUser
    ) {
        adminService.deleteContent(contentId, adminUser);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PatchMapping("/{contentId}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminContentResponse> restoreContent(@PathVariable Long contentId) {
        return ResponseEntity.status(HttpStatus.OK).body(adminService.restoreContent(contentId));
    }
}
