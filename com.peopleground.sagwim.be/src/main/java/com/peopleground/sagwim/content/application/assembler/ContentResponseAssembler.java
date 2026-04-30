package com.peopleground.sagwim.content.application.assembler;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.presentation.dto.response.ContentResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.image.domain.entity.ImageTargetType;
import com.peopleground.sagwim.image.domain.repository.ImageRepository;
import com.peopleground.sagwim.like.domain.repository.ContentLikeRepository;
import com.peopleground.sagwim.tag.domain.entity.ContentTag;
import com.peopleground.sagwim.tag.domain.repository.ContentTagRepository;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

/**
 * 게시글 페이지 응답에 작성자 닉네임 및 현재 사용자의 좋아요 여부를 배치로 채워 넣는
 * 공용 조립기.
 *
 * <p>ContentService 와 TagService 가 서로 다른 소스(전체 목록, 태그별 목록)에서
 * 같은 모양의 응답을 만들어야 하므로, 중복을 피하고 N+1 회피 전략을 일관되게
 * 관리하기 위해 별도의 컴포넌트로 추출되었다. ContentService ↔ TagService 의
 * 기존 의존 방향(ContentService → TagService) 을 보존하기 위해 독립 모듈로 둔다.</p>
 */
@Component
@RequiredArgsConstructor
public class ContentResponseAssembler {

    private final ContentLikeRepository contentLikeRepository;
    private final UserRepository userRepository;
    private final ContentTagRepository contentTagRepository;
    private final ImageRepository imageRepository;

    /**
     * {@link Page}&lt;{@link Content}&gt; 를 {@link ContentResponse} 페이지로 변환한다.
     *
     * <ul>
     *   <li>현재 페이지 작성자 username 을 중복 제거하여 한 번에 nickname 을 조회한다.</li>
     *   <li>로그인 사용자가 있을 때만 좋아요 여부를 배치 조회한다.</li>
     *   <li>페이지가 비어있는 경우 추가 쿼리 없이 즉시 반환한다.</li>
     * </ul>
     */
    public Page<ContentResponse> toResponsePage(Page<Content> contents, CustomUser user) {

        if (contents.isEmpty()) {
            return contents.map(ContentResponse::from);
        }

        List<Content> list = contents.getContent();

        Set<String> usernames = list.stream()
            .map(Content::getCreatedBy)
            .filter(name -> name != null && !name.isBlank())
            .collect(Collectors.toSet());
        Map<String, String> nicknames = usernames.isEmpty()
            ? Collections.emptyMap()
            : userRepository.findNicknamesByUsernames(usernames);

        Set<Long> likedIds = resolveLikedIds(list, user);
        Map<Long, List<String>> tagsByContentId = resolveTagsByContentId(list);
        Map<String, List<String>> imagesByContentId = resolveImagesByContentId(list);

        return contents.map(c -> ContentResponse.from(
            c,
            nicknames.get(c.getCreatedBy()),
            likedIds.contains(c.getId()),
            tagsByContentId.getOrDefault(c.getId(), List.of()),
            imagesByContentId.getOrDefault(String.valueOf(c.getId()), List.of())
        ));
    }

    private Set<Long> resolveLikedIds(List<Content> contents, CustomUser user) {

        if (user == null || contents.isEmpty()) {
            return Collections.emptySet();
        }
        UUID userId = user.getId();
        List<Long> ids = contents.stream().map(Content::getId).toList();
        return contentLikeRepository.findLikedContentIds(userId, ids);
    }

    private Map<String, List<String>> resolveImagesByContentId(List<Content> contents) {
        if (contents.isEmpty()) {
            return Collections.emptyMap();
        }
        List<String> targetIds = contents.stream()
            .map(c -> String.valueOf(c.getId()))
            .toList();
        return imageRepository.findUrlsByTargetIds(ImageTargetType.CONTENT, targetIds);
    }

    private Map<Long, List<String>> resolveTagsByContentId(List<Content> contents) {

        if (contents.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Long> contentIds = contents.stream().map(Content::getId).toList();
        List<ContentTag> mappings = contentTagRepository.findAllFetchTagByContentIdIn(contentIds);
        if (mappings.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, List<String>> result = new LinkedHashMap<>();
        for (ContentTag mapping : mappings) {
            Long contentId = mapping.getContent().getId();
            String tagName = mapping.getTag().getName();
            result.computeIfAbsent(contentId, ignored -> new ArrayList<>()).add(tagName);
        }

        // 불변 리스트로 정규화
        for (Map.Entry<Long, List<String>> entry : result.entrySet()) {
            entry.setValue(List.copyOf(entry.getValue()));
        }

        return result;
    }
}
