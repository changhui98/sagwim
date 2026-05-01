package com.peopleground.sagwim.image.infrastructure.storage;

import com.peopleground.sagwim.image.application.port.ImageStorage;
import com.peopleground.sagwim.image.domain.ImageErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Component
public class LocalImageStorage implements ImageStorage {

    private final String uploadDir;

    public LocalImageStorage(
        @Value("${app.image.upload-dir}") String uploadDir
    ) {
        this.uploadDir = uploadDir.endsWith("/") ? uploadDir : uploadDir + "/";
    }

    @Override
    public String store(MultipartFile file, String storedFilename) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            Path target = uploadPath.resolve(storedFilename).normalize();

            // Path traversal 방어: 저장 경로가 업로드 디렉토리 하위인지 검증
            if (!target.startsWith(uploadPath)) {
                throw new AppException(ImageErrorCode.IMAGE_UPLOAD_FAILED);
            }

            file.transferTo(target.toFile());

            // DB에는 파일명만 저장 — URL 조합은 서비스 레이어에서 담당
            return storedFilename;
        } catch (IOException e) {
            log.error("이미지 저장 실패: storedFilename={}", storedFilename, e);
            throw new AppException(ImageErrorCode.IMAGE_UPLOAD_FAILED);
        }
    }

    @Override
    public void delete(String storedFilename) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path target = uploadPath.resolve(storedFilename).normalize();

            // Path traversal 방어
            if (!target.startsWith(uploadPath)) {
                log.warn("Path traversal 시도 감지: storedFilename={}", storedFilename);
                return;
            }

            Files.deleteIfExists(target);
        } catch (IOException e) {
            log.error("이미지 삭제 실패: storedFilename={}", storedFilename, e);
        }
    }
}
