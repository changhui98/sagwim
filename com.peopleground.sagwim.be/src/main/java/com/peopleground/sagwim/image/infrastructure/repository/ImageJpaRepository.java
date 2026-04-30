package com.peopleground.sagwim.image.infrastructure.repository;

import com.peopleground.sagwim.image.domain.entity.Image;
import com.peopleground.sagwim.image.domain.entity.ImageTargetType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImageJpaRepository extends JpaRepository<Image, Long> {

    List<Image> findByTargetTypeAndTargetIdOrderBySortOrderAsc(ImageTargetType targetType, String targetId);

    List<Image> findByTargetTypeAndTargetIdInOrderBySortOrderAsc(ImageTargetType targetType, List<String> targetIds);

    int countByTargetTypeAndTargetId(ImageTargetType targetType, String targetId);
}
