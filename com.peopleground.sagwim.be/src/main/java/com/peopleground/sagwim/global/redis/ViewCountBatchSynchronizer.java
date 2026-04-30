package com.peopleground.sagwim.global.redis;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 게시글 조회수 배치 동기화 스케줄러.
 *
 * <p>Redis에 축적된 조회수 변경분을 5분 주기로 DB에 반영한다.
 * dirty set에 저장된 contentId 목록을 꺼내 해당 게시글만 업데이트한다.</p>
 */
@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class ViewCountBatchSynchronizer {

    private final ViewCountService viewCountService;
    private final ContentRepository contentRepository;

    /**
     * 5분마다 Redis의 조회수 변경분을 DB에 반영한다.
     */
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    @Transactional
    public void syncViewCountsToDB() {
        Set<Object> dirtyIds = viewCountService.getDirtyContentIds();

        if (dirtyIds == null || dirtyIds.isEmpty()) {
            return;
        }

        log.info("[ViewCount Batch] {}개 게시글 조회수 DB 동기화 시작", dirtyIds.size());

        List<Long> contentIds = dirtyIds.stream()
            .map(id -> Long.parseLong(id.toString()))
            .collect(Collectors.toList());

        List<Content> contents = contentRepository.findAllByIds(contentIds);

        Map<Long, Long> viewCountMap = viewCountService.multiGetViewCounts(contentIds);

        for (Content content : contents) {
            Long redisCount = viewCountMap.getOrDefault(content.getId(), 0L);
            content.syncViewCount(redisCount);
        }

        log.info("[ViewCount Batch] {}개 게시글 조회수 DB 동기화 완료", contents.size());
    }
}
