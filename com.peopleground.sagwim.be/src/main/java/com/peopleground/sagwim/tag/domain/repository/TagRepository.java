package com.peopleground.sagwim.tag.domain.repository;

import com.peopleground.sagwim.tag.domain.entity.Tag;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TagRepository {

    Tag save(Tag tag);

    List<Tag> saveAll(Iterable<Tag> tags);

    Optional<Tag> findByName(String name);

    /**
     * 여러 태그 이름으로 배치 조회한다. (N+1 회피)
     */
    List<Tag> findAllByNames(Collection<String> names);

    List<Tag> findTopByPostCount(int limit);

    List<Tag> searchByNameContaining(String keyword, int limit);

    /**
     * 여러 Tag 의 postCount 를 DB 레벨로 원자 1 증가 (Lost Update 방지).
     */
    int incrementPostCountByIds(Collection<Long> ids);

    /**
     * 여러 Tag 의 postCount 를 DB 레벨로 원자 1 감소 (0 미만 방지).
     */
    int decrementPostCountByIds(Collection<Long> ids);
}
