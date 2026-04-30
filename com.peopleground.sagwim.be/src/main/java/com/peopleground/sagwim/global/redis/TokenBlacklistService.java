package com.peopleground.sagwim.global.redis;

import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

/**
 * 로그아웃된 JWT Access Token을 Redis 블랙리스트로 관리한다.
 *
 * <p>로그아웃 시 해당 토큰을 블랙리스트에 등록하고,
 * JwtAuthenticationFilter에서 매 요청마다 블랙리스트 여부를 확인한다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private static final String BLACKLIST_PREFIX = "blacklist:token:";

    private final RedisTemplate<String, Object> redisTemplate;
    private final RedisFallbackUtil redisFallbackUtil;

    /**
     * 토큰을 블랙리스트에 등록한다.
     *
     * @param token           블랙리스트에 등록할 토큰 (Bearer prefix 제외)
     * @param remainingMillis 토큰 남은 만료 시간 (ms); 해당 시간 후 Redis에서 자동 삭제
     */
    public void addToBlacklist(String token, long remainingMillis) {
        if (remainingMillis <= 0) {
            return;
        }
        redisFallbackUtil.executeWriteWithFallback(() ->
            redisTemplate.opsForValue().set(
                BLACKLIST_PREFIX + token,
                "logout",
                remainingMillis,
                TimeUnit.MILLISECONDS
            )
        );
    }

    /**
     * 토큰이 블랙리스트에 등록되어 있는지 확인한다.
     *
     * @param token 확인할 토큰 (Bearer prefix 제외)
     * @return 블랙리스트에 등록된 토큰이면 true
     */
    public boolean isBlacklisted(String token) {
        return redisFallbackUtil.executeWithFallback(
            () -> Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token)),
            () -> {
                log.warn("[TokenBlacklist] Redis 연결 실패로 블랙리스트 확인 불가. 토큰 허용으로 처리.");
                return false;
            }
        );
    }
}
