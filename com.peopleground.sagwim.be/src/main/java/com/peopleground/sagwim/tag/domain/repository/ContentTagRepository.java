package com.peopleground.sagwim.tag.domain.repository;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.tag.domain.entity.ContentTag;
import java.util.Collection;
import java.util.List;

public interface ContentTagRepository {

    ContentTag save(ContentTag contentTag);

    List<ContentTag> saveAll(Iterable<ContentTag> contentTags);

    List<ContentTag> findAllByContent(Content content);

    List<ContentTag> findAllFetchTagByContentIdIn(Collection<Long> contentIds);

    void deleteAllByContent(Content content);
}
