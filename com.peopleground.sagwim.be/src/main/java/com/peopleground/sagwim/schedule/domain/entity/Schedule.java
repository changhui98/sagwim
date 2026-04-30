package com.peopleground.sagwim.schedule.domain.entity;

import com.peopleground.sagwim.global.entity.AuditingEntity;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.user.domain.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "p_schedule")
@Table(name = "p_schedule")
public class Schedule extends AuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @Column(length = 200)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    public static Schedule of(
        Group group,
        User createdByUser,
        String title,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String location,
        String description
    ) {
        Schedule schedule = new Schedule();
        schedule.group = group;
        schedule.createdByUser = createdByUser;
        schedule.title = title;
        schedule.startAt = startAt;
        schedule.endAt = endAt;
        schedule.location = location;
        schedule.description = description;
        return schedule;
    }
}
