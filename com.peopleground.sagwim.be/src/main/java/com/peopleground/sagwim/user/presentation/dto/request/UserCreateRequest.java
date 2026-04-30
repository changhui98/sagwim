package com.peopleground.sagwim.user.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
    @NotBlank(message = "회원이름(아이디)은 필수입니다.")
    @Pattern(
        regexp = "^[a-zA-Z0-9]+$",
        message = "username은 영어와 숫자만 입력 가능합니다."
    )
    String username,

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, message = "password는 최소 8자 이상이어야 합니다.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;\"'<>,.?/]).+$",
        message = "password는 대문자, 소문자, 특수문자를 각각 하나 이상 포함해야 합니다."
    )
    String password,

    @NotBlank(message = "닉네임은 필수입니다.")
    @Size(min = 2, max = 10, message = "닉네임은 최소2글자 최대10글자까지 가능합니다.")
    @Pattern(
        regexp = "^[가-힣a-zA-Z0-9]+$",
        message = "닉네임은 한글, 영어, 숫자만 사용할 수 있습니다."
    )
    String nickname,

    @NotBlank(message = "이메일은 필수입니다.")
    @Pattern(
        regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
        message = "올바른 이메일 형식이 아닙니다."
    )
    String userEmail,

    @NotBlank(message = "주소는 필수입니다.")
    @Pattern(
        regexp = "^[가-힣a-zA-Z0-9\\s]+$",
        message = "주소는 한글, 영어, 숫자만 사용할 수 있습니다."
    )
    String address

) {
}
