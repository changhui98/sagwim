package com.peopleground.sagwim.image.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "p_image")
@Table(
    name = "p_image",
    indexes = @Index(name = "idx_image_target_type_id", columnList = "target_type, target_id")
)
public class Image extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private ImageTargetType targetType;

    @Column(name = "target_id", nullable = false, length = 100)
    private String targetId;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "stored_filename", nullable = false, unique = true)
    private String storedFilename;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    public static Image of(
        ImageTargetType targetType,
        String targetId,
        String originalFilename,
        String storedFilename,
        String fileUrl,
        long fileSize,
        String contentType,
        int sortOrder
    ) {
        Image image = new Image();
        image.targetType = targetType;
        image.targetId = targetId;
        image.originalFilename = originalFilename;
        image.storedFilename = storedFilename;
        image.fileUrl = fileUrl;
        image.fileSize = fileSize;
        image.contentType = contentType;
        image.sortOrder = sortOrder;
        return image;
    }
}
