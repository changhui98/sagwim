package com.peopleground.sagwim.content.application.service;

import com.peopleground.sagwim.content.application.assembler.ContentResponseAssembler;
import com.peopleground.sagwim.content.domain.ContentErrorCode;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.content.presentation.dto.request.ContentCreateRequest;
import com.peopleground.sagwim.content.presentation.dto.request.ContentUpdateRequest;
import com.peopleground.sagwim.content.presentation.dto.request.SearchType;
import com.peopleground.sagwim.content.presentation.dto.response.ContentCreateResponse;
import com.peopleground.sagwim.content.presentation.dto.response.ContentResponse;
import com.peopleground.sagwim.content.presentation.dto.response.ContentUpdateResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.tag.application.service.TagService;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final TagService tagService;
    private final ContentResponseAssembler contentResponseAssembler;

    @CacheEvict(value = "contentList", allEntries = true)
    @Transactional
    public ContentCreateResponse contentCreate(ContentCreateRequest req, CustomUser user) {

        User findUser = getUser(user);
        Content content = contentRepository.save(Content.of(req.body(), findUser, req.groupId()));

        // 태그가 있는 경우 태그 연동 처리
        List<String> tags = req.tags();
        if (tags != null && !tags.isEmpty()) {
            tagService.attachTagsToContent(content, tags);
        }

        return ContentCreateResponse.from(content);
    }

    /**
     * 전체 피드 게시글 목록 조회. groupId가 null인 게시글(모임 게시글 제외)만 반환한다.
     */
    @Transactional(readOnly = true)
    public PageResponse<ContentResponse> getContents(
        int page, int size, String keyword, SearchType searchType, CustomUser user
    ) {
        Pageable pageable = PageRequest.of(page, size);

        Page<Content> contents = (keyword != null && !keyword.isBlank())
            ? contentRepository.searchContents(keyword, searchType, pageable)
            : contentRepository.findAllContentsWithoutGroup(pageable);

        return PageResponse.from(contentResponseAssembler.toResponsePage(contents, user));
    }

    /**
     * 특정 모임의 게시글 목록 조회.
     */
    @Transactional(readOnly = true)
    public PageResponse<ContentResponse> getContentsByGroupId(Long groupId, int page, int size, CustomUser user) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Content> contents = contentRepository.findAllByGroupId(groupId, pageable);
        return PageResponse.from(contentResponseAssembler.toResponsePage(contents, user));
    }

    /**
     * 현재 로그인한 사용자가 작성한 글 목록을 최신순으로 페이지네이션하여 반환한다.
     */
    @Transactional(readOnly = true)
    public PageResponse<ContentResponse> getMyContents(CustomUser customUser, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Content> contents = contentRepository.findAllByUsername(customUser.getUsername(), pageable);
        return PageResponse.from(contentResponseAssembler.toResponsePage(contents, customUser));
    }

    @Transactional(readOnly = true)
    public PageResponse<ContentResponse> getContentsByUsername(CustomUser customUser, String username, int page, int size) {
        User author = userRepository.findByUsername(username)
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));

        if (author.isDeleted()) {
            throw new AppException(UserErrorCode.USER_NOT_FOUND);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Content> contents = contentRepository.findAllByUsername(username, pageable);
        return PageResponse.from(contentResponseAssembler.toResponsePage(contents, customUser));
    }

    @CacheEvict(value = "contentList", allEntries = true)
    @Transactional
    public ContentUpdateResponse updateContent(Long contentId, ContentUpdateRequest req, CustomUser customUser) {

        Content content = getContentByOwner(contentId, customUser);
        content.update(req.body());

        // tags 필드가 null이 아닌 경우 태그 교체 (null이면 태그 변경 없음)
        if (req.tags() != null) {
            tagService.updateContentTags(content, req.tags());
        }

        return ContentUpdateResponse.from(content);
    }

    @CacheEvict(value = "contentList", allEntries = true)
    @Transactional
    public void deleteContent(Long contentId, CustomUser customUser) {

        Content content = getContentByOwner(contentId, customUser);
        // 게시글 소프트 삭제 시 태그 연결 데이터 정리
        tagService.detachTagsFromContent(content);
        content.delete();
    }

    private Content getContentByOwner(Long contentId, CustomUser customUser) {

        Content content = contentRepository.findById(contentId)
            .orElseThrow(() -> new AppException(ContentErrorCode.CONTENT_NOT_FOUND));

        if (!content.getUser().getUsername().equals(customUser.getUsername())) {
            throw new AppException(ContentErrorCode.CONTENT_FORBIDDEN);
        }

        return content;
    }

    /**
     * 특정 태그의 게시글 목록을 조회한다.
     *
     * <p>작성자 닉네임과 현재 로그인 사용자의 좋아요 여부(likedByMe)를
     * {@link ContentResponseAssembler}를 통해 일관되게 배치로 채운다.
     * 비로그인 호출의 경우 user 가 null 이며 likedByMe 는 모두 false.</p>
     */
    @Transactional(readOnly = true)
    public PageResponse<ContentResponse> getContentsByTagName(
        String tagName, int page, int size, CustomUser user
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Content> contents = contentRepository.findAllByTagName(tagName, pageable);
        return PageResponse.from(contentResponseAssembler.toResponsePage(contents, user));
    }

    private User getUser(CustomUser user) {

        return userRepository.findByUsername(user.getUsername())
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));
    }
}
