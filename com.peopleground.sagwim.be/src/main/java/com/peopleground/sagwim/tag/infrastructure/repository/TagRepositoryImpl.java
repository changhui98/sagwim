package com.peopleground.sagwim.tag.infrastructure.repository;

import com.peopleground.sagwim.tag.domain.entity.Tag;
import com.peopleground.sagwim.tag.domain.repository.TagRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class TagRepositoryImpl implements TagRepository {

    private final TagJpaRepository tagJpaRepository;
    private final TagQueryRepository tagQueryRepository;

    @Override
    public Tag save(Tag tag) {
        return tagJpaRepository.save(tag);
    }

    @Override
    public List<Tag> saveAll(Iterable<Tag> tags) {
        return tagJpaRepository.saveAll(tags);
    }

    @Override
    public Optional<Tag> findByName(String name) {
        return tagJpaRepository.findByName(name);
    }

    @Override
    public List<Tag> findAllByNames(Collection<String> names) {
        if (names == null || names.isEmpty()) {
            return List.of();
        }
        return tagJpaRepository.findAllByNameIn(names);
    }

    @Override
    public List<Tag> findTopByPostCount(int limit) {
        return tagQueryRepository.findTopByPostCount(limit);
    }

    @Override
    public List<Tag> searchByNameContaining(String keyword, int limit) {
        return tagQueryRepository.searchByNameContaining(keyword, limit);
    }

    @Override
    public int incrementPostCountByIds(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        return tagJpaRepository.incrementPostCountByIds(ids);
    }

    @Override
    public int decrementPostCountByIds(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        return tagJpaRepository.decrementPostCountByIds(ids);
    }
}
