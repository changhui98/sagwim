package com.peopleground.sagwim.user.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.user.application.UserService;
import com.peopleground.sagwim.user.presentation.dto.request.UserUpdateRequest;
import com.peopleground.sagwim.user.presentation.dto.response.UserDetailResponse;
import com.peopleground.sagwim.user.presentation.dto.response.UserResponseMarker;
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

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<PageResponse<UserResponseMarker>> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<UserResponseMarker> res = userService.getUsers(page, size);

        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<UserResponseMarker>> searchUsers(
        @RequestParam(required = false, defaultValue = "") String keyword,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<UserResponseMarker> res = userService.searchUsers(keyword, page, size);
        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    @PatchMapping("/me")
    public ResponseEntity<UserDetailResponse> updateProfile(
        @AuthenticationPrincipal CustomUser customUser,
        @RequestBody UserUpdateRequest req
    ) {
        UserDetailResponse res = userService.updateProfile(customUser,req);

        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDetailResponse> getMyProfile(
        @AuthenticationPrincipal CustomUser customUser
    ) {
        UserDetailResponse res = userService.getMyProfile(customUser);

        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserDetailResponse> getProfileByUsername(
        @PathVariable String username
    ) {
        UserDetailResponse res = userService.getProfileByUsername(username);
        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser(
        @AuthenticationPrincipal CustomUser customUser
    ) {
        userService.deleteUser(customUser);

        return ResponseEntity.noContent().build();
    }

}
