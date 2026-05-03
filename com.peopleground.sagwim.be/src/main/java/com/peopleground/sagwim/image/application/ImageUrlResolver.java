package com.peopleground.sagwim.image.application;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * DB에 저장된 이미지 경로 값을 클라이언트가 사용할 수 있는 URL로 변환하는 유틸 컴포넌트.
 *
 * <p>DB에는 파일명만 저장되는 것이 원칙이나, 하위 호환을 위해 다음 세 가지 형태를 모두 처리한다:
 * <ul>
 *   <li>{@code null} — 그대로 null 반환</li>
 *   <li>{@code "http://..."} / {@code "https://..."} — 외부 URL (소셜 로그인 프로필 등), 그대로 반환</li>
 *   <li>{@code "/images/..."} — 이미 prefix가 포함된 경로, 그대로 반환</li>
 *   <li>{@code "파일명.jpg"} — 파일명만 있는 경우, urlPrefix + "/" + 파일명 으로 조합</li>
 * </ul>
 */
@Component
public class ImageUrlResolver {

    private final String urlPrefix;

    public ImageUrlResolver(
        @Value("${app.image.url-prefix:/images}") String urlPrefix
    ) {
        // 트레일링 슬래시 제거 — "/" + filename 형태로 일관되게 조합
        this.urlPrefix = urlPrefix.endsWith("/")
            ? urlPrefix.substring(0, urlPrefix.length() - 1)
            : urlPrefix;
    }

    public String resolve(String fileUrlOrFilename) {
        if (fileUrlOrFilename == null
            || fileUrlOrFilename.startsWith("http://")
            || fileUrlOrFilename.startsWith("https://")
            || fileUrlOrFilename.startsWith("/")) {
            return fileUrlOrFilename;
        }
        return urlPrefix + "/" + fileUrlOrFilename;
    }
}
