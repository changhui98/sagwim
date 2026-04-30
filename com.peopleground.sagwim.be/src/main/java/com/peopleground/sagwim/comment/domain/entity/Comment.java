package com.peopleground.sagwim.comment.domain.entity;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.global.entity.AuditingEntity;
import com.peopleground.sagwim.user.domain.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "p_comment")
@Table(
    name = "p_comment",
    indexes = {
        @Index(name = "idx_comment_content_id_parent_id", columnList = "content_id, parent_id")
    }
)
public class Comment extends AuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false)
    private Content content;

    /**
     * 대댓글 구조: parent가 null이면 최상위 댓글, null이 아니면 대댓글.
     * 인접 목록(Adjacency List) 패턴으로 향후 계층 확장 가능하도록 설계.
     * 단, UI/UX는 1 depth로 제한한다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false)
    private int likeCount = 0;

    public static Comment of(Content content, User author, String body) {
        Comment comment = new Comment();
        comment.content = content;
        comment.author = author;
        comment.body = body;
        comment.likeCount = 0;
        return comment;
    }

    public static Comment ofReply(Content content, Comment parent, User author, String body) {
        Comment comment = new Comment();
        comment.content = content;
        comment.parent = parent;
        comment.author = author;
        comment.body = body;
        comment.likeCount = 0;
        return comment;
    }

    public void update(String body) {
        this.body = body;
    }

    public boolean isReply() {
        return this.parent != null;
    }
}
