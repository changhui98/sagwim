package com.peopleground.sagwim.global.configure;

import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
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

        User user = userRepository.findByUsername(username).orElseThrow(
            () -> new AppException(UserErrorCode.USER_NOT_FOUND)
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
