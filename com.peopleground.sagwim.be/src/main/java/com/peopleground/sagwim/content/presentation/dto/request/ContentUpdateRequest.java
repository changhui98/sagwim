package com.peopleground.sagwim.content.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record ContentUpdateRequest(
    @NotBlank(message = "내용을 입력해주세요.")
    String body,

    List<String> tags   // 선택 필드: null 이면 태그 변경 없음, 빈 리스트이면 태그 전체 제거
) {

}
