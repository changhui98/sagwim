package com.peopleground.sagwim.global.redis;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.cache.RedisCacheWriter;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 캐시 설정.
 *
 * <p>캐시별 기본 TTL 전략 (Cache Stampede 방지를 위해 각 entry 의 put 시점에 지터 적용)</p>
 * <ul>
 *   <li>popularTags: 10분 ± 지터(0~60초)</li>
 *   <li>tagAutocomplete: 30분 ± 지터(0~120초)</li>
 *   <li>contentList: 3분 ± 지터(0~30초)</li>
 *   <li>contentLikeCount: 1시간 ± 지터(0~300초)</li>
 *   <li>commentLikeCount: 1시간 ± 지터(0~300초)</li>
 * </ul>
 *
 * <p>지터 구현 상세: {@link RedisCacheWriter.TtlFunction} 을 사용해 entry 가 put 되는
 * <b>매 시점</b>마다 {@link ThreadLocalRandom} 기반으로 TTL 을 재계산한다. 빈 생성 시점에
 * 단 한 번 {@code nextInt()} 가 호출되면 모든 엔트리가 동일한 TTL 을 공유해 Stampede 방지
 * 효과가 사라진다는 기존 버그를 해결한다.</p>
 *
 * <p>Redis 장애 시 Fallback 처리는 각 Service 레이어에서 try-catch 로 처리한다.</p>
 */
@Configuration
@EnableCaching
public class RedisConfig {

    private ObjectMapper buildRedisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL,
            JsonTypeInfo.As.PROPERTY
        );
        return mapper;
    }

    private RedisSerializer<Object> buildJsonSerializer() {
        return new SagwimJsonRedisSerializer(buildRedisObjectMapper());
    }

    /**
     * 엔트리가 put 될 때마다 {@code baseSeconds + [0, jitterSeconds)} 범위의 TTL 을 반환한다.
     * {@link ThreadLocalRandom} 을 사용해 멀티스레드 경합 없이 스레드-안전하게 동작한다.
     */
    private RedisCacheWriter.TtlFunction jitteredTtl(long baseSeconds, int jitterSeconds) {
        return (key, value) -> Duration.ofSeconds(
            baseSeconds + ThreadLocalRandom.current().nextInt(jitterSeconds)
        );
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        RedisSerializer<Object> jsonSerializer = buildJsonSerializer();
        StringRedisSerializer stringSerializer = new StringRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setHashValueSerializer(jsonSerializer);
        return template;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisSerializer<Object> jsonSerializer = buildJsonSerializer();

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer))
            .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        cacheConfigurations.put("popularTags",
            defaultConfig.entryTtl(jitteredTtl(600, 60)));

        cacheConfigurations.put("tagAutocomplete",
            defaultConfig.entryTtl(jitteredTtl(1800, 120)));

        cacheConfigurations.put("contentList",
            defaultConfig.entryTtl(jitteredTtl(180, 30)));

        cacheConfigurations.put("contentLikeCount",
            defaultConfig.entryTtl(jitteredTtl(3600, 300)));

        cacheConfigurations.put("commentLikeCount",
            defaultConfig.entryTtl(jitteredTtl(3600, 300)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .build();
    }
}
