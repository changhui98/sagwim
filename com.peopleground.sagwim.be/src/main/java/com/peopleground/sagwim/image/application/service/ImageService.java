package com.peopleground.sagwim.image.application.service;

import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.image.application.port.ImageStorage;
import com.peopleground.sagwim.image.domain.ImageErrorCode;
import com.peopleground.sagwim.image.domain.entity.Image;
import com.peopleground.sagwim.image.domain.entity.ImageTargetType;
import com.peopleground.sagwim.image.domain.repository.ImageRepository;
import com.peopleground.sagwim.image.presentation.dto.response.ImageResponse;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ImageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024L; // 5MB

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    );

    private final ImageRepository imageRepository;
    private final ImageStorage imageStorage;

    @Transactional
    public ImageResponse uploadImage(
        MultipartFile file,
        ImageTargetType targetType,
        String targetId
    ) {
        validateFile(file);

        String originalFilename = file.getOriginalFilename() != null
            ? file.getOriginalFilename()
            : "unknown";

        String extension = extractExtension(originalFilename);
        String storedFilename = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);

        String fileUrl = imageStorage.store(file, storedFilename);

        int sortOrder = imageRepository.countByTargetTypeAndTargetId(targetType, targetId);

        Image image = Image.of(
            targetType,
            targetId,
            originalFilename,
            storedFilename,
            fileUrl,
            file.getSize(),
            file.getContentType(),
            sortOrder
        );

        Image saved = imageRepository.save(image);
        return ImageResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ImageResponse> getImages(ImageTargetType targetType, String targetId) {
        return imageRepository.findByTarget(targetType, targetId)
            .stream()
            .map(ImageResponse::from)
            .toList();
    }

    @Transactional
    public void deleteImage(Long imageId) {
        Image image = imageRepository.findById(imageId)
            .orElseThrow(() -> new AppException(ImageErrorCode.IMAGE_NOT_FOUND));

        imageStorage.delete(image.getStoredFilename());
        imageRepository.deleteById(imageId);
    }

    private void validateFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ImageErrorCode.IMAGE_TOO_LARGE);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new AppException(ImageErrorCode.IMAGE_INVALID_TYPE);
        }
    }

    private String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(dotIndex + 1).toLowerCase();
    }
}
