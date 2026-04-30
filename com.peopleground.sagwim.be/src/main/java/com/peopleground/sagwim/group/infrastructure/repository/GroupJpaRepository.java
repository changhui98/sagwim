package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GroupJpaRepository extends JpaRepository<Group, Long> {

    @Modifying
    @Query("UPDATE p_group g SET g.currentMemberCount = g.currentMemberCount + 1 WHERE g.id = :groupId")
    void incrementMemberCount(@Param("groupId") Long groupId);

    @Modifying
    @Query("UPDATE p_group g SET g.currentMemberCount = g.currentMemberCount - 1 WHERE g.id = :groupId AND g.currentMemberCount > 0")
    void decrementMemberCount(@Param("groupId") Long groupId);

    @Modifying
    @Query("UPDATE p_group g SET g.likeCount = g.likeCount + 1 WHERE g.id = :groupId")
    void incrementLikeCount(@Param("groupId") Long groupId);

    @Modifying
    @Query("UPDATE p_group g SET g.likeCount = g.likeCount - 1 WHERE g.id = :groupId AND g.likeCount > 0")
    void decrementLikeCount(@Param("groupId") Long groupId);

    @Query("SELECT g.likeCount FROM p_group g WHERE g.id = :groupId")
    Integer findLikeCountById(@Param("groupId") Long groupId);
}
