package com.peopleground.sagwim.group.domain.repository;

import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GroupRepository {

    Group save(Group group);

    Optional<Group> findById(Long id);

    Page<Group> findAll(Pageable pageable, String keyword, GroupCategory category);

    Page<Group> findNewGroups(Pageable pageable);

    Page<Group> findPopularGroups(Pageable pageable);

    Page<Group> findByMemberUsername(String username, Pageable pageable);

    void incrementMemberCount(Long groupId);

    void decrementMemberCount(Long groupId);

    void incrementLikeCount(Long groupId);

    void decrementLikeCount(Long groupId);

    Integer findLikeCountById(Long groupId);

    Map<String, Long> countMonthlyCreations(LocalDateTime windowStart);
}
