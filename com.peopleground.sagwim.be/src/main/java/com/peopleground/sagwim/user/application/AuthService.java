package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.global.redis.TokenBlacklistService;
import com.peopleground.sagwim.global.security.jwt.JwtTokenProvider;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import com.peopleground.sagwim.user.infrastructure.GeocodingClient;
import com.peopleground.sagwim.user.infrastructure.GeocodingClient.GeoPoint;
import com.peopleground.sagwim.user.presentation.dto.request.UserCreateRequest;
import com.peopleground.sagwim.user.presentation.dto.response.UserCreateResponse;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GeocodingClient geocodingClient;
    private final EmailVerificationService emailVerificationService;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final GeometryFactory geometryFactory;

    @Transactional
    public UserCreateResponse signUp(UserCreateRequest request) {

        validateDuplicateUsername(request.username());
        validateDuplicateEmail(request.userEmail());

        emailVerificationService.checkPreVerified(request.userEmail());

        Point point;

        GeoPoint geo = geocodingClient.convert(request.address());

        point = geometryFactory.createPoint(
            new Coordinate(geo.longitude(), geo.latitude())
        );
        point.setSRID(4326);

        User user = User.of(
            request.username(),
            passwordEncoder.encode(request.password()),
            request.nickname(),
            request.userEmail(),
            request.address(),
            point
        );

        user.verifyEmail();
        User saveUser = userRepository.save(user);

        emailVerificationService.deletePreVerification(saveUser.getUserEmail());

        return UserCreateResponse.from(saveUser);
    }

    private void validateDuplicateEmail(String userEmail) {

        if (userRepository.existsByUserEmail(userEmail)) {
            throw new AppException(UserErrorCode.DUPLICATE_EMAIL);
        }
    }

    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username);
    }

    /**
     * 로그아웃: Access Token을 Redis 블랙리스트에 등록한다.
     *
     * @param token Authorization 헤더에서 추출한 Access Token (Bearer prefix 제외)
     */
    public void signOut(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        long remaining = jwtTokenProvider.getRemainingExpiration(token);
        tokenBlacklistService.addToBlacklist(token, remaining);
    }

    private void validateDuplicateUsername(String username) {

        if (userRepository.existsByUsername(username)) {
            throw new AppException(UserErrorCode.DUPLICATE_USERNAME);
        }
    }
}
