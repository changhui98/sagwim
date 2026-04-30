package com.peopleground.sagwim.schedule.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.schedule.application.service.ScheduleService;
import com.peopleground.sagwim.schedule.presentation.dto.request.ScheduleCreateRequest;
import com.peopleground.sagwim.schedule.presentation.dto.response.ScheduleResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/groups/{groupId}/schedules")
public class ScheduleController {

    private final ScheduleService scheduleService;

    @PostMapping
    public ResponseEntity<ScheduleResponse> createSchedule(
        @PathVariable Long groupId,
        @Valid @RequestBody ScheduleCreateRequest request,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        ScheduleResponse response = scheduleService.createSchedule(groupId, request, customUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ScheduleResponse>> getSchedulesByMonth(
        @PathVariable Long groupId,
        @RequestParam int year,
        @RequestParam int month
    ) {
        List<ScheduleResponse> response = scheduleService.getSchedulesByMonth(groupId, year, month);
        return ResponseEntity.ok(response);
    }
}
