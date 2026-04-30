package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.global.security.jwt.JwtTokenProvider;
import com.peopleground.sagwim.user.application.port.OAuthClient;
import com.peopleground.sagwim.user.application.port.OAuthUserProfile;
import com.peopleground.sagwim.user.domain.entity.OAuthProvider;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import com.peopleground.sagwim.user.presentation.dto.request.SocialSignInRequest;
import com.peopleground.sagwim.user.presentation.dto.response.SocialSignInResponse;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocialAuthService {

    private final UserRepository userRepository;
    private final OAuthClient kakaoOAuthClient;
    private final OAuthClient googleOAuthClient;
    private final JwtTokenProvider jwtTokenProvider;

    public SocialAuthService(
        UserRepository userRepository,
        @Qualifier("kakaoOAuthClient") OAuthClient kakaoOAuthClient,
        @Qualifier("googleOAuthClient") OAuthClient googleOAuthClient,
        JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.kakaoOAuthClient = kakaoOAuthClient;
        this.googleOAuthClient = googleOAuthClient;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public SocialSignInResponse socialSignIn(SocialSignInRequest request) {
        OAuthProvider provider = resolveProvider(request.provider());

        return switch (provider) {
            case KAKAO -> handleSignIn(OAuthProvider.KAKAO, kakaoOAuthClient, request.code(), request.redirectUri());
            case GOOGLE -> handleSignIn(OAuthProvider.GOOGLE, googleOAuthClient, request.code(), request.redirectUri());
            default -> throw new AppException(ApiErrorCode.INVALID_REQUEST);
        };
    }

    private SocialSignInResponse handleSignIn(OAuthProvider provider, OAuthClient client, String code, String redirectUri) {
        String accessToken = client.exchangeToken(code, redirectUri);
        OAuthUserProfile profile = client.fetchUserProfile(accessToken);

        Optional<User> existing = userRepository.findByProviderAndProviderId(provider, profile.providerId());

        if (existing.isPresent()) {
            User user = existing.get();
            String jwtToken = jwtTokenProvider.createToken(user.getId(), user.getUsername(), user.getRole());
            return new SocialSignInResponse(jwtToken, false, user.getNickname());
        }

        // 신규 가입
        String email = profile.email() != null ? profile.email()
            : provider.name().toLowerCase() + "_" + profile.providerId() + "@sagwim.social";

        User newUser = User.ofSocial(
            provider,
            profile.providerId(),
            profile.nickname(),
            email,
            profile.profileImageUrl(),
            ""
        );
        User saved = userRepository.save(newUser);
        String jwtToken = jwtTokenProvider.createToken(saved.getId(), saved.getUsername(), saved.getRole());
        return new SocialSignInResponse(jwtToken, true, saved.getNickname());
    }

    private OAuthProvider resolveProvider(String provider) {
        try {
            return OAuthProvider.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ApiErrorCode.INVALID_REQUEST);
        }
    }
}
