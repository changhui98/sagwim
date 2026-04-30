package com.peopleground.sagwim.global.configure;

import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // DaoAuthenticationProvider는 UsernameNotFoundException을 BadCredentialsException으로
        // 변환하여 unsuccessfulAuthentication()으로 전달한다.
        // AppException(RuntimeException)을 던지면 ExceptionTranslationFilter가 가로채
        // AuthenticationEntryPoint → 401로 잘못 처리된다.
        User user = userRepository.findByUsername(username).orElseThrow(
            () -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username)
        );

        /**
         * TODO : 탈퇴한 유저 로그인 시도시 금지하는 기능 구현
         */

        return new CustomUser(
            user.getId(),
            user.getUsername(),
            user.getPassword(),
            user.getRole(),
            user.isEmailVerified()
        );
    }
}
