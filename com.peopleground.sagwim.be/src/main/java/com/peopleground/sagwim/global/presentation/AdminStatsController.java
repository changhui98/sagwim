package com.peopleground.sagwim.global.presentation;

import com.peopleground.sagwim.global.application.AdminStatsService;
import com.peopleground.sagwim.global.dto.MonthlyStatsResponse;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @GetMapping("/users/monthly-signups")
    public ResponseEntity<MonthlyStatsResponse> getMonthlySignups(
        @RequestParam(defaultValue = "12") int months
    ) {
        validateMonths(months);
        return ResponseEntity.ok(adminStatsService.getMonthlySignups(months));
    }

    @GetMapping("/contents/monthly-creations")
    public ResponseEntity<MonthlyStatsResponse> getMonthlyContentCreations(
        @RequestParam(defaultValue = "12") int months
    ) {
        validateMonths(months);
        return ResponseEntity.ok(adminStatsService.getMonthlyContentCreations(months));
    }

    private void validateMonths(int months) {
        if (months < 1 || months > 36) {
            throw new AppException(ApiErrorCode.INVALID_REQUEST);
        }
    }
}
