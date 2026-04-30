package com.peopleground.sagwim.tag.domain.entity;

import com.peopleground.sagwim.content.domain.entity.Content;
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
import jakarta.persistence.UniqueConstraint;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "p_content_tag")
@Table(
    name = "p_content_tag",
    uniqueConstraints = @UniqueConstraint(columnNames = {"content_id", "tag_id"}),
    indexes = @Index(name = "idx_content_tag_tag_id", columnList = "tag_id")
)
public class ContentTag {

    private static final Clock KST_CLOCK = Clock.system(ZoneId.of("Asia/Seoul"));

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false)
    private Content content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    public static ContentTag of(Content content, Tag tag) {
        ContentTag contentTag = new ContentTag();
        contentTag.content = content;
        contentTag.tag = tag;
        contentTag.createdDate = LocalDateTime.now(KST_CLOCK);
        return contentTag;
    }
}
