package com.peopleground.sagwim.like.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.user.domain.entity.User;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "p_group_like")
@Table(
    name = "p_group_like",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_group_like_group_user",
        columnNames = {"group_id", "user_id"}
    ),
    indexes = @Index(name = "idx_group_like_group_id", columnList = "group_id")
)
public class GroupLike extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public static GroupLike of(Group group, User user) {
        GroupLike groupLike = new GroupLike();
        groupLike.group = group;
        groupLike.user = user;
        return groupLike;
    }
}
