package com.peopleground.sagwim.global.redis;

import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.stereotype.Component;

/**
 * Redis 장애 시 DB Fallback을 처리하는 공통 유틸리티.
 *
 * <p>Redis 연결 장애가 발생하더라도 서비스가 정상 동작할 수 있도록,
 * 캐시 레이어 조작 실패 시 DB를 직접 조회하는 Fallback 로직을 제공한다.</p>
 */
@Slf4j
@Component
public class RedisFallbackUtil {

    /**
     * Redis 작업을 시도하고, 실패하면 fallback 공급자를 실행한다.
     *
     * @param redisOperation Redis 작업 (get, set 등)
     * @param fallback Redis 장애 시 실행할 대안 로직
     * @param <T> 반환 타입
     * @return Redis 작업 결과 또는 fallback 결과
     */
    public <T> T executeWithFallback(Supplier<T> redisOperation, Supplier<T> fallback) {
        try {
            return redisOperation.get();
        } catch (RedisConnectionFailureException e) {
            log.warn("[Redis Fallback] Redis 연결 실패로 DB 직접 조회로 전환합니다. cause={}", e.getMessage());
            return fallback.get();
        } catch (Exception e) {
            log.warn("[Redis Fallback] Redis 작업 중 오류 발생, DB 직접 조회로 전환합니다. cause={}", e.getMessage());
            return fallback.get();
        }
    }

    /**
     * Redis 쓰기 작업을 시도하고, 실패하면 경고 로그를 남긴다.
     * 쓰기 실패는 캐시 미스 정도의 영향이므로 서비스 오류로 전파하지 않는다.
     *
     * @param redisOperation Redis 쓰기 작업
     */
    public void executeWriteWithFallback(Runnable redisOperation) {
        try {
            redisOperation.run();
        } catch (RedisConnectionFailureException e) {
            log.warn("[Redis Fallback] Redis 쓰기 작업 실패 (캐시 미스로 처리). cause={}", e.getMessage());
        } catch (Exception e) {
            log.warn("[Redis Fallback] Redis 쓰기 중 오류 발생 (캐시 미스로 처리). cause={}", e.getMessage());
        }
    }
}
