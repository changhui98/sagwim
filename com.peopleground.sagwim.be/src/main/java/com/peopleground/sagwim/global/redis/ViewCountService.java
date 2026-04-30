package com.peopleground.sagwim.global.redis;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

/**
 * 게시글 조회수 Redis Write-through 서비스.
 *
 * <p>조회수는 Redis 에 먼저 기록하고 5분 주기 배치 ({@code @Scheduled}) 로 DB 에 반영한다.
 * Key 형식: {@code "viewCount:{contentId}"} (영구 보존)</p>
 *
 * <p>Redis 장애 시에는 {@link RedisFallbackUtil} 을 통해 조용히 실패 처리한다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ViewCountService {

    private static final String VIEW_COUNT_KEY_PREFIX = "viewCount:";
    private static final String DIRTY_VIEW_COUNT_SET = "dirtyViewCounts";
    private static final String DIRTY_PROCESSING_PREFIX = DIRTY_VIEW_COUNT_SET + ":processing:";

    private final RedisTemplate<String, Object> redisTemplate;
    private final RedisFallbackUtil redisFallbackUtil;

    /**
     * 게시글 조회수를 1 증가시킨다. Redis 에 기록하고, 변경된 키를 dirty set 에 추가한다.
     */
    public void incrementViewCount(Long contentId) {
        redisFallbackUtil.executeWriteWithFallback(() -> {
            String key = VIEW_COUNT_KEY_PREFIX + contentId;
            redisTemplate.opsForValue().increment(key);
            redisTemplate.opsForSet().add(DIRTY_VIEW_COUNT_SET, String.valueOf(contentId));
        });
    }

    /**
     * 특정 게시글의 현재 조회수를 조회한다.
     */
    public Long getViewCount(Long contentId) {
        return redisFallbackUtil.executeWithFallback(() -> {
            String key = VIEW_COUNT_KEY_PREFIX + contentId;
            Object value = redisTemplate.opsForValue().get(key);
            return value != null ? Long.parseLong(value.toString()) : 0L;
        }, () -> 0L);
    }

    /**
     * dirty set 에서 처리 대상 contentId 목록을 원자적으로 꺼낸다.
     *
     * <p>원자성 전략 (Redis RENAME 기반)</p>
     * <ul>
     *   <li>1) {@code RENAME dirtyViewCounts dirtyViewCounts:processing:{ts}} 로 즉시
     *       처리 영역으로 옮긴다. RENAME 은 원자 연산이므로, 이후 도착하는 incrementViewCount
     *       호출은 새로 만들어지는 빈 {@code dirtyViewCounts} 에 쌓이며 다음 배치에서 처리된다.</li>
     *   <li>2) 옮긴 temp key 에서 SMEMBERS 로 조회 후 DELETE 한다.</li>
     *   <li>3) 기존 SMEMBERS → DELETE 방식에서는 두 명령 사이에 들어온 쓰기가 유실될 수
     *       있었는데, 이를 해결한다.</li>
     * </ul>
     *
     * <p>원본 set 이 존재하지 않는 경우(처리할 대상 없음)에는 {@link Set#of()} 를 반환한다.</p>
     */
    public Set<Object> getDirtyContentIds() {
        return redisFallbackUtil.executeWithFallback(() -> {
            Boolean hasWork = redisTemplate.hasKey(DIRTY_VIEW_COUNT_SET);
            if (!Boolean.TRUE.equals(hasWork)) {
                return Set.of();
            }

            String processingKey = DIRTY_PROCESSING_PREFIX + System.currentTimeMillis();
            try {
                redisTemplate.rename(DIRTY_VIEW_COUNT_SET, processingKey);
            } catch (Exception renameFail) {
                // RENAME 실패는 원본 키가 그 사이 사라진 경우 등 race 로 발생 가능 → 빈 set 으로 처리
                log.warn("[ViewCount Batch] dirty set RENAME 실패, 빈 처리 목록으로 진행. cause={}",
                    renameFail.getMessage());
                return Set.of();
            }

            Set<Object> members = redisTemplate.opsForSet().members(processingKey);
            redisTemplate.delete(processingKey);
            return members != null ? members : Set.of();
        }, Set::of);
    }

    /**
     * 여러 게시글의 조회수를 Redis MGET(multiGet)으로 한 번에 조회한다.
     *
     * <p>개별 {@code getViewCount} 루프 대비 N번의 Redis 왕복을 1번으로 줄여
     * 배치 동기화 성능을 개선한다. Redis 장애 시 {@link RedisFallbackUtil}을 통해
     * 조용히 실패 처리하며, 값이 없는 ID는 0L로 채워 반환한다.</p>
     *
     * @param contentIds 조회할 게시글 ID 목록
     * @return contentId → viewCount 맵 (순서 보장 불필요)
     */
    public Map<Long, Long> multiGetViewCounts(List<Long> contentIds) {
        return redisFallbackUtil.executeWithFallback(() -> {
            List<String> keys = contentIds.stream()
                .map(id -> VIEW_COUNT_KEY_PREFIX + id)
                .toList();
            List<Object> values = redisTemplate.opsForValue().multiGet(keys);
            Map<Long, Long> result = new HashMap<>();
            for (int i = 0; i < contentIds.size(); i++) {
                Object v = (values != null) ? values.get(i) : null;
                result.put(contentIds.get(i), v != null ? Long.parseLong(v.toString()) : 0L);
            }
            return result;
        }, () -> {
            Map<Long, Long> fallback = new HashMap<>();
            for (Long id : contentIds) {
                fallback.put(id, 0L);
            }
            return fallback;
        });
    }

    /**
     * Redis 에 저장된 특정 게시글의 조회수를 초기값으로 설정한다. (DB 동기화 완료 후 호출)
     */
    public void initViewCount(Long contentId, long count) {
        redisFallbackUtil.executeWriteWithFallback(() -> {
            String key = VIEW_COUNT_KEY_PREFIX + contentId;
            redisTemplate.opsForValue().set(key, String.valueOf(count));
        });
    }
}
