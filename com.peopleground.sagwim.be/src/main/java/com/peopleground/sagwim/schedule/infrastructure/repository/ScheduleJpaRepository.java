package com.peopleground.sagwim.schedule.infrastructure.repository;

import com.peopleground.sagwim.schedule.domain.entity.Schedule;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduleJpaRepository extends JpaRepository<Schedule, Long> {

    @Query("SELECT s FROM p_schedule s LEFT JOIN FETCH s.createdByUser WHERE s.group.id = :groupId AND s.startAt >= :start AND s.startAt < :end AND s.deletedDate IS NULL")
    List<Schedule> findByGroupIdAndStartAtBetween(
        @Param("groupId") Long groupId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );
}
