package com.peopleground.sagwim.global.security;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.ErrorResponse;
import com.peopleground.sagwim.global.security.jwt.JwtTokenProvider;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.ObjectMapper;

public class AuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String LOGIN_PROCESS_URL = "/api/v1/auth/sign-in";

    public AuthenticationFilter(JwtTokenProvider jwtTokenProvider, ObjectMapper objectMapper) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.objectMapper = objectMapper;
        setFilterProcessesUrl(LOGIN_PROCESS_URL);
    }

    @Override
    public Authentication attemptAuthentication(
        HttpServletRequest request,
        HttpServletResponse response
    ) throws AuthenticationException {

        try {
            FromLoginRequest loginRequest = objectMapper.readValue(request.getInputStream(),
                FromLoginRequest.class);

            UsernamePasswordAuthenticationToken authRequest =
                UsernamePasswordAuthenticationToken.unauthenticated(loginRequest.username(),
                    loginRequest.password());

            return this.getAuthenticationManager().authenticate(authRequest);
        } catch (IOException e) {
            // IOException은 AuthenticationException이 아니므로 BadCredentialsException으로 감싸야
            // unsuccessfulAuthentication()이 정상 호출된다.
            throw new BadCredentialsException("요청 본문을 파싱할 수 없습니다.", e);
        }
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request,
        HttpServletResponse response, FilterChain chain, Authentication authResult)
        throws IOException, ServletException {

        CustomUser customUser = (CustomUser) authResult.getPrincipal();

        if (!customUser.isEmailVerified()) {
            response.setStatus(UserErrorCode.EMAIL_NOT_VERIFIED.getStatus().value());
            response.setContentType("application/json;charset=UTF-8");

            ErrorResponse errorResponse = ErrorResponse.from(UserErrorCode.EMAIL_NOT_VERIFIED);
            objectMapper.writeValue(response.getOutputStream(), errorResponse);
            return;
        }

        UUID id = customUser.getId();
        String username = customUser.getUsername();
        UserRole role = customUser.getRole();

        String token = jwtTokenProvider.createToken(id, username, role);
        response.addHeader(AUTHORIZATION_HEADER, token);
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request,
        HttpServletResponse response, AuthenticationException failed)
        throws IOException, ServletException {

        response.setStatus(UserErrorCode.INVALID_CREDENTIALS.getStatus().value());
        response.setContentType("application/json;charset=UTF-8");

        ErrorResponse errorResponse = ErrorResponse.from(UserErrorCode.INVALID_CREDENTIALS);
        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
}
