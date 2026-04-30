package com.peopleground.sagwim.user.domain.entity;

public enum UserRole {
    USER("ROLE_USER"),
    ADMIN("ROLE_ADMIN");

    private final String authority;

    UserRole(String authority) {
        this.authority = authority;
    }

    public boolean isAdmin() {
        return this == ADMIN;
    }

    public String getAuthority() {
        return authority;
    }
}
