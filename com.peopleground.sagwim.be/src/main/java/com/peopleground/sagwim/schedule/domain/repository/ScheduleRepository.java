package com.peopleground.sagwim.schedule.domain.repository;

import com.peopleground.sagwim.schedule.domain.entity.Schedule;
import java.util.List;

public interface ScheduleRepository {

    Schedule save(Schedule schedule);

    List<Schedule> findByGroupIdAndYearMonth(Long groupId, int year, int month);
}
