package com.peopleground.sagwim.user.infrastructure.repository;

import com.peopleground.sagwim.user.domain.entity.OAuthProvider;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepository {

    private final UserJpaRepository userJpaRepository;
    private final UserQueryRepository userQueryRepository;

    @Override
    public Optional<User> findByUsername(String username) {

        return userJpaRepository.findByUsername(username);
    }

    @Override
    public boolean existsByUsername(String username) {

        return userJpaRepository.existsByUsername(username);
    }

    @Override
    public User save(User user) {

        return userJpaRepository.save(user);
    }

    @Override
    public Page<User> findAllUsers(Pageable pageable) {

        return userQueryRepository.findAllUsers(pageable);
    }

    @Override
    public Page<User> findAllUserForAdmin(Pageable pageable) {

        return userQueryRepository.findAllUsersForAdmin(pageable);
    }

    @Override
    public User updateProfile(User updateUser) {
        return userJpaRepository.save(updateUser);
    }

    @Override
    public Optional<User> findByUserEmail(String email) {

        return userJpaRepository.findByUserEmail(email);
    }

    @Override
    public boolean existsByUserEmail(String email) {

        return userJpaRepository.existsByUserEmail(email);
    }

    @Override
    public Map<String, Long> countMonthlySignups(LocalDateTime windowStart) {

        return userQueryRepository.countMonthlySignups(windowStart);
    }

    @Override
    public Map<String, String> findNicknamesByUsernames(Collection<String> usernames) {

        return userQueryRepository.findNicknamesByUsernames(usernames);
    }

    @Override
    public Optional<User> findByProviderAndProviderId(OAuthProvider provider, String providerId) {

        return userJpaRepository.findByProviderAndProviderId(provider, providerId);
    }

    @Override
    public Page<User> searchByKeyword(String keyword, Pageable pageable) {

        return userQueryRepository.searchByKeyword(keyword, pageable);
    }
}
