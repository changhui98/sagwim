package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import com.peopleground.sagwim.user.presentation.dto.response.AdminUserDetailResponse;
import com.peopleground.sagwim.user.presentation.dto.response.AdminUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("userAdminService")
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> getUsersForAdmin(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        return PageResponse.from(
            userRepository.findAllUserForAdmin(pageable).map(AdminUserResponse::from)
        );
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserForAdmin(String username) {

        return AdminUserDetailResponse.from(getUser(username));
    }

    @Transactional
    public void deleteUserForAdmin(String username) {

        User user = getUser(username);
        user.delete();
    }

    private User getUser(String username) {

        return userRepository.findByUsername(username).orElseThrow(
            () -> new AppException(UserErrorCode.USER_NOT_FOUND)
        );
    }
}
