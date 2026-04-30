package com.peopleground.sagwim.global.configure;

import com.peopleground.sagwim.user.domain.entity.UserRole;
import jakarta.annotation.Nullable;
import java.util.Collection;
import java.util.Collections;
import java.util.UUID;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
public class CustomUser implements UserDetails {

    private final UUID id;
    private final String username;
    private final String password;
    private final UserRole role;
    private final boolean emailVerified;

    public CustomUser(UUID id, String username, String password, UserRole role, boolean emailVerified) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.role = role;
        this.emailVerified = emailVerified;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public @Nullable String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority(role.getAuthority()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }
}
