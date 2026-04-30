package com.peopleground.sagwim.tag.infrastructure.repository;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.tag.domain.entity.ContentTag;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContentTagJpaRepository extends JpaRepository<ContentTag, Long> {

    @Query("SELECT ct FROM p_content_tag ct JOIN FETCH ct.tag WHERE ct.content = :content")
    List<ContentTag> findAllByContent(@Param("content") Content content);

    void deleteAllByContent(Content content);
}
