package com.peopleground.sagwim.global.security.jwt;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.redis.TokenBlacklistService;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
        FilterChain filterChain) throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = jwtTokenProvider.resolveToken(request);

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)
            && !tokenBlacklistService.isBlacklisted(token)) {
            UUID id = jwtTokenProvider.getUserId(token);
            String username = jwtTokenProvider.getUsername(token);
            String role = jwtTokenProvider.getRoles(token);
            UserRole userRole = UserRole.valueOf(role);
            CustomUser customUser = new CustomUser(id, username, null, userRole, true);

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(customUser, null, customUser.getAuthorities());

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}
