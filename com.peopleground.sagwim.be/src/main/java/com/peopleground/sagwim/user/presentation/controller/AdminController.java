package com.peopleground.sagwim.user.presentation.controller;

import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.user.application.AdminService;
import com.peopleground.sagwim.user.presentation.dto.response.AdminUserDetailResponse;
import com.peopleground.sagwim.user.presentation.dto.response.AdminUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController("userAdminController")
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<PageResponse<AdminUserResponse>> getUsersForAdmin(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<AdminUserResponse> res = adminService.getUsersForAdmin(page, size);

        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    @GetMapping("/{username}")
    public ResponseEntity<AdminUserDetailResponse> getUserForAdmin(
        @PathVariable String username
    ) {
        AdminUserDetailResponse res = adminService.getUserForAdmin(username);

        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<Void> deleteUserForAdmin(
        @PathVariable String username
    ) {
        adminService.deleteUserForAdmin(username);

        return ResponseEntity.noContent().build();
    }


}
