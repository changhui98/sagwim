package com.peopleground.sagwim.schedule.application.service;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.GroupErrorCode;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.repository.GroupMemberRepository;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.schedule.domain.ScheduleErrorCode;
import com.peopleground.sagwim.schedule.domain.entity.Schedule;
import com.peopleground.sagwim.schedule.domain.repository.ScheduleRepository;
import com.peopleground.sagwim.schedule.presentation.dto.request.ScheduleCreateRequest;
import com.peopleground.sagwim.schedule.presentation.dto.response.ScheduleResponse;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public ScheduleResponse createSchedule(Long groupId, ScheduleCreateRequest request, CustomUser customUser) {
        Group group = findGroup(groupId);

        if (!groupMemberRepository.existsByGroupIdAndUsername(groupId, customUser.getUsername())) {
            throw new AppException(ScheduleErrorCode.SCHEDULE_NOT_MEMBER);
        }

        if (!request.endAt().isAfter(request.startAt())) {
            throw new AppException(ScheduleErrorCode.SCHEDULE_INVALID_DATE);
        }

        User createdByUser = getUser(customUser.getUsername());

        Schedule schedule = Schedule.of(
            group,
            createdByUser,
            request.title(),
            request.startAt(),
            request.endAt(),
            request.location(),
            request.description()
        );

        Schedule saved = scheduleRepository.save(schedule);
        return ScheduleResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getSchedulesByMonth(Long groupId, int year, int month) {
        findGroup(groupId);
        return scheduleRepository.findByGroupIdAndYearMonth(groupId, year, month)
            .stream()
            .map(ScheduleResponse::from)
            .toList();
    }

    private Group findGroup(Long groupId) {
        return groupRepository.findById(groupId)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_FOUND));
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));
    }
}
