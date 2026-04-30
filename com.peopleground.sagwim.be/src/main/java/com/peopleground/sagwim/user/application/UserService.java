package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import com.peopleground.sagwim.user.infrastructure.GeocodingClient;
import com.peopleground.sagwim.user.infrastructure.GeocodingClient.GeoPoint;
import com.peopleground.sagwim.user.presentation.dto.request.UserUpdateRequest;
import com.peopleground.sagwim.user.presentation.dto.response.UserDetailResponse;
import com.peopleground.sagwim.user.presentation.dto.response.UserResponse;
import com.peopleground.sagwim.user.presentation.dto.response.UserResponseMarker;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GeocodingClient geocodingClient;
    private final GeometryFactory geometryFactory;

    @Transactional(readOnly = true)
    public UserDetailResponse getMyProfile(CustomUser customUser) {
        User user = getUser(customUser);

        return UserDetailResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserDetailResponse getProfileByUsername(String username) {
        User user = getActiveUserByUsername(username);
        return UserDetailResponse.from(user);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponseMarker> getUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        Page<UserResponse> result = userRepository.findAllUsers(pageable).map(UserResponse::from);

        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponseMarker> searchUsers(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserResponse> result = userRepository.searchByKeyword(keyword, pageable).map(UserResponse::from);
        return PageResponse.from(result);
    }

    @Transactional
    public UserDetailResponse updateProfile(CustomUser customUser, UserUpdateRequest req) {

        User user = getUser(customUser);

        String encodedNewPassword = user.getPassword();
        boolean wantsPasswordChange = req.newPassword() != null && !req.newPassword().isBlank();

        if (wantsPasswordChange) {
            // 소셜 가입 사용자는 비밀번호가 없으므로 비밀번호 변경 불가
            if (user.getPassword() == null) {
                throw new AppException(UserErrorCode.SOCIAL_USER_CANNOT_CHANGE_PASSWORD);
            }

            if (req.currentPassword() == null || req.currentPassword().isBlank()) {
                throw new AppException(UserErrorCode.PASSWORD_REQUIRED);
            }

            if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
                throw new AppException(UserErrorCode.INVALID_CURRENT_PASSWORD);
            }
            encodedNewPassword = passwordEncoder.encode(req.newPassword());
        }

        // 빈 문자열("")은 null과 동일하게 처리하여 기존 값을 유지한다.
        boolean hasAddress = req.address() != null && !req.address().isBlank();
        String address = hasAddress ? req.address() : user.getAddress();
        Point location;

        if (hasAddress) {
            GeoPoint geo = geocodingClient.convert(req.address());
            location = geometryFactory.createPoint(
                new Coordinate(geo.longitude(), geo.latitude())
            );
            location.setSRID(4326);
        } else {
            location = user.getLocation();
        }

        String nickname = (req.nickname() != null && !req.nickname().isBlank())
            ? req.nickname() : user.getNickname();
        String userEmail = (req.userEmail() != null && !req.userEmail().isBlank())
            ? req.userEmail() : user.getUserEmail();
        String profileImageUrl = req.profileImageUrl() != null
            ? req.profileImageUrl() : user.getProfileImageUrl();

        User updateUser = user.updateUser(nickname, userEmail, address, location, encodedNewPassword);
        updateUser.updateProfileImageUrl(profileImageUrl);

        User saveUser = userRepository.updateProfile(updateUser);

        return UserDetailResponse.from(saveUser);
    }

    @Transactional
    public void deleteUser(CustomUser customUser) {
        User user = getUser(customUser);

        user.delete();
        userRepository.save(user);
    }

    private User getUser(CustomUser customUser) {
        return getActiveUserByUsername(customUser.getUsername());
    }

    private User getActiveUserByUsername(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(
            () -> new AppException(UserErrorCode.USER_NOT_FOUND)
        );

        if (user.isDeleted()) {
            throw new AppException(UserErrorCode.USER_NOT_FOUND);
        }

        return user;
    }
}
