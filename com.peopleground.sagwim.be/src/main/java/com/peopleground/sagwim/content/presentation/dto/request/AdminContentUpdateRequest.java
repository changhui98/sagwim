package com.peopleground.sagwim.content.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AdminContentUpdateRequest(
    @NotBlank(message = "내용을 입력해주세요.")
    String body
) {

}
