package com.peopleground.sagwim.content.presentation.dto.request;

import java.util.List;

public record ContentCreateRequest(
    String body,
    List<String> tags,   // 선택 필드: null 또는 빈 리스트이면 태그 없는 게시글로 처리
    Long groupId         // 선택 필드: 모임 내 게시글인 경우 해당 groupId, 일반 게시글은 null
) {

}
