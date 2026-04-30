package com.peopleground.sagwim.tag.application.service;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.tag.domain.TagErrorCode;
import com.peopleground.sagwim.tag.domain.entity.ContentTag;
import com.peopleground.sagwim.tag.domain.entity.Tag;
import com.peopleground.sagwim.tag.domain.repository.ContentTagRepository;
import com.peopleground.sagwim.tag.domain.repository.TagRepository;
import com.peopleground.sagwim.tag.presentation.dto.response.TagResponse;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TagService {

    private static final int POPULAR_TAGS_LIMIT = 20;
    private static final int AUTOCOMPLETE_LIMIT = 10;
    private static final int MAX_TAGS_PER_CONTENT = 10;
    private static final int MAX_TAG_LENGTH = 30;

    private final TagRepository tagRepository;
    private final ContentTagRepository contentTagRepository;

    /**
     * 인기 태그 목록을 조회한다. (Cache-Aside, TTL 은 Redis 설정에서 관리)
     */
    @Cacheable(value = "popularTags", unless = "#result.isEmpty()")
    @Transactional(readOnly = true)
    public List<TagResponse> getPopularTags() {
        return tagRepository.findTopByPostCount(POPULAR_TAGS_LIMIT)
            .stream()
            .map(TagResponse::from)
            .toList();
    }

    /**
     * 태그 자동완성 검색. 입력된 키워드로 태그명을 부분 검색하여 반환한다.
     *
     * <p>캐시 키는 소문자 + 공백 제거로 정규화해 "Java" / "java" / "  java " 가
     * 동일 캐시 슬롯을 공유하도록 한다.</p>
     */
    @Cacheable(
        value = "tagAutocomplete",
        key = "(#keyword == null ? '' : #keyword.toLowerCase().trim())",
        unless = "#result.isEmpty()"
    )
    @Transactional(readOnly = true)
    public List<TagResponse> searchTags(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }
        String normalized = keyword.toLowerCase().trim();
        return tagRepository.searchByNameContaining(normalized, AUTOCOMPLETE_LIMIT)
            .stream()
            .map(TagResponse::from)
            .toList();
    }

    /**
     * 게시글에 태그를 연결한다.
     *
     * <p>성능/동시성 전략</p>
     * <ul>
     *   <li>정규화된 태그명으로 기존 Tag 를 <b>배치 조회</b> (IN 쿼리 1회).</li>
     *   <li>존재하지 않는 태그만 추려서 <b>배치 INSERT</b> (saveAll 1회).</li>
     *   <li>ContentTag 매핑도 배치 INSERT 로 한 번에 저장한다.</li>
     *   <li>postCount 는 Tag id 리스트에 대한 <b>원자 벌크 UPDATE</b> 로 증가시킨다.
     *       (Entity 필드 ++ 로 인한 Lost Update 제거)</li>
     * </ul>
     */
    @CacheEvict(value = {"popularTags", "tagAutocomplete"}, allEntries = true)
    @Transactional
    public void attachTagsToContent(Content content, List<String> tagNames) {
        validateTagNames(tagNames);

        List<String> normalized = normalize(tagNames);
        if (normalized.isEmpty()) {
            return;
        }

        Map<String, Tag> existing = tagRepository.findAllByNames(normalized).stream()
            .collect(Collectors.toMap(Tag::getName, t -> t));

        List<Tag> toCreate = new ArrayList<>();
        for (String name : normalized) {
            if (!existing.containsKey(name)) {
                toCreate.add(Tag.of(name));
            }
        }
        if (!toCreate.isEmpty()) {
            tagRepository.saveAll(toCreate).forEach(t -> existing.put(t.getName(), t));
        }

        List<ContentTag> mappings = new ArrayList<>(normalized.size());
        List<Long> idsToIncrement = new ArrayList<>(normalized.size());
        for (String name : normalized) {
            Tag tag = existing.get(name);
            mappings.add(ContentTag.of(content, tag));
            idsToIncrement.add(tag.getId());
        }
        contentTagRepository.saveAll(mappings);
        tagRepository.incrementPostCountByIds(idsToIncrement);
    }

    /**
     * 게시글 태그를 모두 제거하고 새 태그 목록으로 교체한다.
     *
     * <p>NOTE: 내부적으로 {@link #attachTagsToContent(Content, List)} 를 직접 호출하므로
     * 그쪽의 {@code @CacheEvict} / {@code @Transactional} AOP 는 적용되지 않는다.
     * 다만 본 메서드에도 동일한 {@code @CacheEvict(allEntries=true)} 와 {@code @Transactional}
     * 이 붙어 있어 최종적인 캐시 무효화와 트랜잭션 전파 효과는 동일하게 보장된다.</p>
     */
    @CacheEvict(value = {"popularTags", "tagAutocomplete"}, allEntries = true)
    @Transactional
    public void updateContentTags(Content content, List<String> newTagNames) {
        detachInternal(content);

        if (newTagNames != null && !newTagNames.isEmpty()) {
            attachTagsToContent(content, newTagNames);
        }
    }

    /**
     * 게시글 소프트 삭제 시 태그 연결을 제거하고 postCount 를 원자적으로 감소시킨다.
     */
    @CacheEvict(value = {"popularTags", "tagAutocomplete"}, allEntries = true)
    @Transactional
    public void detachTagsFromContent(Content content) {
        detachInternal(content);
    }

    /**
     * 특정 게시글에 연결된 태그 이름 목록을 반환한다.
     */
    @Transactional(readOnly = true)
    public List<String> getTagNamesByContent(Content content) {
        return contentTagRepository.findAllByContent(content)
            .stream()
            .map(ct -> ct.getTag().getName())
            .toList();
    }

    /**
     * content 에 연결된 모든 태그를 끊고, 끊은 태그들의 postCount 를 원자 벌크 UPDATE 로 감소시킨다.
     */
    private void detachInternal(Content content) {
        List<ContentTag> existingMappings = contentTagRepository.findAllByContent(content);
        if (existingMappings.isEmpty()) {
            return;
        }

        List<Long> tagIds = existingMappings.stream()
            .map(ct -> ct.getTag().getId())
            .toList();

        contentTagRepository.deleteAllByContent(content);
        tagRepository.decrementPostCountByIds(tagIds);
    }

    /**
     * 태그 이름을 소문자 + 공백제거로 정규화하고, 삽입 순서를 보존한 중복 제거를 수행한다.
     */
    private List<String> normalize(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return List.of();
        }
        Set<String> unique = new LinkedHashSet<>();
        for (String raw : tagNames) {
            if (raw == null) continue;
            String n = raw.toLowerCase().trim();
            if (!n.isEmpty()) {
                unique.add(n);
            }
        }
        return new ArrayList<>(unique);
    }

    private void validateTagNames(List<String> tagNames) {
        if (tagNames == null) {
            return;
        }
        if (tagNames.size() > MAX_TAGS_PER_CONTENT) {
            throw new com.peopleground.sagwim.global.exception.AppException(TagErrorCode.TAG_LIMIT_EXCEEDED);
        }
        for (String name : tagNames) {
            if (name != null && name.length() > MAX_TAG_LENGTH) {
                throw new com.peopleground.sagwim.global.exception.AppException(TagErrorCode.TAG_NAME_TOO_LONG);
            }
        }
    }
}
