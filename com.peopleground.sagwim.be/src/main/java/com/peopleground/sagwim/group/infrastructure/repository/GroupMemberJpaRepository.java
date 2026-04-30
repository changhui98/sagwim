package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.entity.GroupMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GroupMemberJpaRepository extends JpaRepository<GroupMember, Long> {

    @Query("SELECT gm FROM p_group_member gm JOIN gm.user u WHERE gm.group.id = :groupId AND u.username = :username")
    Optional<GroupMember> findByGroupIdAndUsername(@Param("groupId") Long groupId, @Param("username") String username);

    @Query("SELECT gm FROM p_group_member gm JOIN FETCH gm.user WHERE gm.group.id = :groupId AND gm.deletedDate IS NULL")
    List<GroupMember> findByGroupId(@Param("groupId") Long groupId);

    @Query("SELECT CASE WHEN COUNT(gm) > 0 THEN true ELSE false END FROM p_group_member gm JOIN gm.user u WHERE gm.group.id = :groupId AND u.username = :username")
    boolean existsByGroupIdAndUsername(@Param("groupId") Long groupId, @Param("username") String username);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM p_group_member gm WHERE gm.group.id = :groupId")
    void deleteAllByGroupId(@Param("groupId") Long groupId);
}
