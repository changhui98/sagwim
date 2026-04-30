package com.peopleground.sagwim.group.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
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
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "p_group_member")
@Table(
    name = "p_group_member",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_group_member_group_user",
        columnNames = {"group_id", "user_id"}
    )
)
public class GroupMember extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupMemberRole role;

    public static GroupMember of(Group group, User user, GroupMemberRole role) {
        GroupMember member = new GroupMember();
        member.group = group;
        member.user = user;
        member.role = role;
        return member;
    }

    public boolean isLeader() {
        return this.role == GroupMemberRole.LEADER;
    }
}
