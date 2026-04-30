package com.peopleground.sagwim.global.security;

public record FromLoginRequest(
    String username,
    String password
) {

}
