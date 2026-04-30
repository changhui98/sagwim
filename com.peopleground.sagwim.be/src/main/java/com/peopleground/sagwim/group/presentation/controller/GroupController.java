package com.peopleground.sagwim.group.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.group.application.service.GroupService;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.presentation.dto.request.GroupCreateRequest;
import com.peopleground.sagwim.group.presentation.dto.request.GroupUpdateRequest;
import com.peopleground.sagwim.group.presentation.dto.response.GroupDetailResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupMemberResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/groups")
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(
        @Valid @RequestBody GroupCreateRequest request,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        GroupResponse response = groupService.createGroup(request, customUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<GroupResponse>> getGroups(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) GroupCategory category
    ) {
        PageResponse<GroupResponse> response = groupService.getGroups(page, size, keyword, category);
        return ResponseEntity.ok(response);
    }

    /**
     * 생성된 지 7일 미만인 신규 모임 목록을 조회합니다.
     * 인증 없이 접근 가능하지만, 클라이언트는 토큰을 포함하여 호출합니다.
     */
    @GetMapping("/recent")
    public ResponseEntity<PageResponse<GroupResponse>> getNewGroups(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        PageResponse<GroupResponse> response = groupService.getNewGroups(page, size);
        return ResponseEntity.ok(response);
    }

    /**
     * 좋아요 수 내림차순으로 인기 모임 목록을 조회합니다.
     */
    @GetMapping("/popular")
    public ResponseEntity<PageResponse<GroupResponse>> getPopularGroups(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        PageResponse<GroupResponse> response = groupService.getPopularGroups(page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupDetailResponse> getGroup(@PathVariable Long groupId) {
        GroupDetailResponse response = groupService.getGroup(groupId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping(value = "/{groupId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GroupResponse> updateGroupImage(
        @PathVariable Long groupId,
        @RequestParam("file") MultipartFile file,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        GroupResponse response = groupService.updateGroupImage(groupId, file, customUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{groupId}")
    public ResponseEntity<GroupResponse> updateGroup(
        @PathVariable Long groupId,
        @Valid @RequestBody GroupUpdateRequest request,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        GroupResponse response = groupService.updateGroup(groupId, request, customUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
        @PathVariable Long groupId,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        groupService.deleteGroup(groupId, customUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{groupId}/join")
    public ResponseEntity<Void> joinGroup(
        @PathVariable Long groupId,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        groupService.joinGroup(groupId, customUser);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(
        @PathVariable Long groupId,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        groupService.leaveGroup(groupId, customUser);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}/members/{username}")
    public ResponseEntity<Void> kickMember(
        @PathVariable Long groupId,
        @PathVariable String username,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        groupService.kickMember(groupId, username, customUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMemberResponse>> getMembers(@PathVariable Long groupId) {
        List<GroupMemberResponse> response = groupService.getMembers(groupId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<PageResponse<GroupResponse>> getMyGroups(
        @AuthenticationPrincipal CustomUser customUser,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<GroupResponse> response = groupService.getMyGroups(customUser, page, size);
        return ResponseEntity.ok(response);
    }
}
