package com.peopleground.sagwim.group.domain.entity;

import com.peopleground.sagwim.global.entity.AuditingEntity;
import com.peopleground.sagwim.user.domain.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

// GROUP 은 SQL 예약어이므로 반드시 @Entity(name="p_group") + @Table(name="p_group") 명시
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Entity(name = "p_group")
@Table(name = "p_group")
public class Group extends AuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupMeetingType meetingType;

    @Column(nullable = false)
    private int maxMemberCount;

    @Column(nullable = false)
    private int currentMemberCount = 0;

    @Column(nullable = true)
    private String imageUrl;

    @Column(nullable = true, length = 50)
    private String region;

    @Column(nullable = false)
    private int likeCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leader_id", nullable = false)
    private User leader;

    public static Group of(
        String name,
        String description,
        GroupCategory category,
        GroupMeetingType meetingType,
        String region,
        int maxMemberCount,
        User leader
    ) {
        Group group = new Group();
        group.name = name;
        group.description = description;
        group.category = category;
        group.meetingType = meetingType;
        group.region = meetingType == GroupMeetingType.ONLINE ? null : region;
        group.maxMemberCount = maxMemberCount;
        group.currentMemberCount = 0;
        group.likeCount = 0;
        group.leader = leader;
        return group;
    }

    public void update(String name, String description, GroupCategory category, GroupMeetingType meetingType, String region, int maxMemberCount) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.meetingType = meetingType;
        this.region = meetingType == GroupMeetingType.ONLINE ? null : region;
        this.maxMemberCount = maxMemberCount;
    }

    public void incrementMemberCount() {
        this.currentMemberCount++;
    }

    public void decrementMemberCount() {
        if (this.currentMemberCount > 0) {
            this.currentMemberCount--;
        }
    }

    public boolean isFull() {
        return this.currentMemberCount >= this.maxMemberCount;
    }

    public void updateImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void delete(User user) {
        this.deleteBy(user);
    }
}
