package com.peopleground.sagwim.image.infrastructure.repository;

import com.peopleground.sagwim.image.domain.entity.Image;
import com.peopleground.sagwim.image.domain.entity.ImageTargetType;
import com.peopleground.sagwim.image.domain.repository.ImageRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ImageRepositoryImpl implements ImageRepository {

    private final ImageJpaRepository imageJpaRepository;

    @Override
    public Image save(Image image) {
        return imageJpaRepository.save(image);
    }

    @Override
    public Optional<Image> findById(Long id) {
        return imageJpaRepository.findById(id);
    }

    @Override
    public List<Image> findByTarget(ImageTargetType targetType, String targetId) {
        return imageJpaRepository.findByTargetTypeAndTargetIdOrderBySortOrderAsc(targetType, targetId);
    }

    @Override
    public Map<String, List<String>> findUrlsByTargetIds(ImageTargetType targetType, List<String> targetIds) {
        if (targetIds == null || targetIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Image> images = imageJpaRepository
            .findByTargetTypeAndTargetIdInOrderBySortOrderAsc(targetType, targetIds);

        Map<String, List<String>> result = new LinkedHashMap<>();
        for (Image image : images) {
            result.computeIfAbsent(image.getTargetId(), ignored -> new ArrayList<>())
                  .add(image.getFileUrl());
        }
        return result;
    }

    @Override
    public int countByTargetTypeAndTargetId(ImageTargetType targetType, String targetId) {
        return imageJpaRepository.countByTargetTypeAndTargetId(targetType, targetId);
    }

    @Override
    public void deleteById(Long id) {
        imageJpaRepository.deleteById(id);
    }
}
