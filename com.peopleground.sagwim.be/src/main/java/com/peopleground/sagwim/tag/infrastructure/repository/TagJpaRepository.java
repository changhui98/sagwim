package com.peopleground.sagwim.tag.infrastructure.repository;

import com.peopleground.sagwim.tag.domain.entity.Tag;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TagJpaRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findByName(String name);

    /**
     * 여러 태그를 이름으로 한 번에 조회 (N+1 방지용 배치 조회).
     */
    List<Tag> findAllByNameIn(Collection<String> names);

    /**
     * 여러 Tag 의 postCount 를 원자적으로 1 증가시킨다.
     * 동시 요청 Lost Update 방지 + N 회 UPDATE 를 1 회로 축약.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE p_tag t SET t.postCount = t.postCount + 1 WHERE t.id IN :ids")
    int incrementPostCountByIds(@Param("ids") Collection<Long> ids);

    /**
     * 여러 Tag 의 postCount 를 원자적으로 1 감소시킨다 (0 미만 방지).
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE p_tag t SET t.postCount = t.postCount - 1 WHERE t.id IN :ids AND t.postCount > 0")
    int decrementPostCountByIds(@Param("ids") Collection<Long> ids);
}
