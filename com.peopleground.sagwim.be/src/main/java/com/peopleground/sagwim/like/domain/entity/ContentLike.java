package com.peopleground.sagwim.like.domain.entity;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.global.entity.BaseEntity;
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
@Entity(name = "p_content_like")
@Table(
    name = "p_content_like",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_content_like_content_user",
        columnNames = {"content_id", "user_id"}
    ),
    indexes = @Index(name = "idx_content_like_content_id", columnList = "content_id")
)
public class ContentLike extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false)
    private Content content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public static ContentLike of(Content content, User user) {
        ContentLike contentLike = new ContentLike();
        contentLike.content = content;
        contentLike.user = user;
        return contentLike;
    }
}
