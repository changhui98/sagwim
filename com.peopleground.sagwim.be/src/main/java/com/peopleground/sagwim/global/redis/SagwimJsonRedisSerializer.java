package com.peopleground.sagwim.global.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.SerializationException;

/**
 * 커스텀 Redis JSON 직렬화기.
 *
 * <p>Spring Data Redis 4.x에서 기존 Jackson 직렬화기가 deprecated 처리되어,
 * ObjectMapper를 직접 주입할 수 있는 커스텀 직렬화기를 구현한다.
 * JavaTimeModule, ActivateDefaultTyping 설정이 포함된 ObjectMapper를 사용하여
 * LocalDateTime 포함 다형성 타입의 직렬화/역직렬화를 지원한다.</p>
 */
public class SagwimJsonRedisSerializer implements RedisSerializer<Object> {

    private final ObjectMapper objectMapper;

    public SagwimJsonRedisSerializer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public byte[] serialize(Object value) throws SerializationException {
        if (value == null) {
            return new byte[0];
        }
        try {
            return objectMapper.writeValueAsBytes(value);
        } catch (Exception e) {
            throw new SerializationException("Redis 직렬화 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public Object deserialize(byte[] bytes) throws SerializationException {
        if (bytes == null || bytes.length == 0) {
            return null;
        }
        try {
            return objectMapper.readValue(bytes, Object.class);
        } catch (Exception e) {
            throw new SerializationException("Redis 역직렬화 실패: " + e.getMessage(), e);
        }
    }
}
