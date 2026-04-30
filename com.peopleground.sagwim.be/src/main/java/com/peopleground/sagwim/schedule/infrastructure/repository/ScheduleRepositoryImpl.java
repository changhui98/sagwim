package com.peopleground.sagwim.schedule.infrastructure.repository;

import com.peopleground.sagwim.schedule.domain.entity.Schedule;
import com.peopleground.sagwim.schedule.domain.repository.ScheduleRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ScheduleRepositoryImpl implements ScheduleRepository {

    private final ScheduleJpaRepository scheduleJpaRepository;

    @Override
    public Schedule save(Schedule schedule) {
        return scheduleJpaRepository.save(schedule);
    }

    @Override
    public List<Schedule> findByGroupIdAndYearMonth(Long groupId, int year, int month) {
        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime end = start.plusMonths(1);
        return scheduleJpaRepository.findByGroupIdAndStartAtBetween(groupId, start, end);
    }
}
