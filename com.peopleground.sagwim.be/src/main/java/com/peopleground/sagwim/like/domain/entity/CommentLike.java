package com.peopleground.sagwim.like.domain.entity;

import com.peopleground.sagwim.comment.domain.entity.Comment;
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
@Entity(name = "p_comment_like")
@Table(
    name = "p_comment_like",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_comment_like_comment_user",
        columnNames = {"comment_id", "user_id"}
    ),
    indexes = @Index(name = "idx_comment_like_comment_id", columnList = "comment_id")
)
public class CommentLike extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public static CommentLike of(Comment comment, User user) {
        CommentLike commentLike = new CommentLike();
        commentLike.comment = comment;
        commentLike.user = user;
        return commentLike;
    }
}
