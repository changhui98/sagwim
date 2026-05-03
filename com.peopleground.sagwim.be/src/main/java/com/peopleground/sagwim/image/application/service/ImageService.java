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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
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
    private final String urlPrefix;

    public ImageService(
        ImageRepository imageRepository,
        ImageStorage imageStorage,
        @Value("${app.image.url-prefix:/images}") String urlPrefix
    ) {
        this.imageRepository = imageRepository;
        this.imageStorage = imageStorage;
        // 트레일링 슬래시 제거 — 조합 시 "/" + filename 형태로 일관되게 처리
        this.urlPrefix = urlPrefix.endsWith("/") ? urlPrefix.substring(0, urlPrefix.length() - 1) : urlPrefix;
    }

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

        // store()는 파일명만 반환 — DB에는 파일명만 저장
        imageStorage.store(file, storedFilename);

        int sortOrder = imageRepository.countByTargetTypeAndTargetId(targetType, targetId);

        Image image = Image.of(
            targetType,
            targetId,
            originalFilename,
            storedFilename,
            storedFilename,
            file.getSize(),
            file.getContentType(),
            sortOrder
        );

        Image saved = imageRepository.save(image);
        return ImageResponse.from(saved, resolveUrl(saved.getFileUrl()));
    }

    @Transactional(readOnly = true)
    public List<ImageResponse> getImages(ImageTargetType targetType, String targetId) {
        return imageRepository.findByTarget(targetType, targetId)
            .stream()
            .map(image -> ImageResponse.from(image, resolveUrl(image.getFileUrl())))
            .toList();
    }

    /**
     * DB에 저장된 값을 클라이언트에 전달할 URL로 변환한다.
     *
     * <p>하위 호환: 다음 세 가지 형태를 모두 처리한다.
     * <ul>
     *   <li>{@code null} — null 반환</li>
     *   <li>{@code "http://..."} / {@code "https://..."} — 외부 URL, 그대로 반환</li>
     *   <li>{@code "/images/..."} — 이미 prefix가 포함된 경로, 그대로 반환</li>
     *   <li>{@code "파일명.jpg"} — 파일명만 있는 경우, urlPrefix + "/" + 파일명 으로 조합</li>
     * </ul>
     * {@link com.peopleground.sagwim.image.application.ImageUrlResolver}와 동일한 로직을 유지한다.
     */
    private String resolveUrl(String fileUrlOrFilename) {
        if (fileUrlOrFilename == null
            || fileUrlOrFilename.startsWith("http://")
            || fileUrlOrFilename.startsWith("https://")
            || fileUrlOrFilename.startsWith("/")) {
            return fileUrlOrFilename;
        }
        return urlPrefix + "/" + fileUrlOrFilename;
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
