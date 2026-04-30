package com.peopleground.sagwim.user.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Entity(name = "p_user")
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column
    private String password;

    @Column(nullable = false)
    private String nickname;

    @Column(nullable = false, unique = true)
    private String userEmail;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Column(nullable = false)
    private String address;

    @JdbcTypeCode(SqlTypes.GEOGRAPHY)
    @Column(nullable = false, columnDefinition = "geography(Point,4326)")
    private Point location;

    @Column(nullable = false)
    private boolean emailVerified = false;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OAuthProvider provider = OAuthProvider.LOCAL;

    @Column(name = "provider_id")
    private String providerId;

    public void updateProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public static User of
        (
            String username,
            String password,
            String nickname,
            String userEmail,
            String address,
            Point location
        ) {
        User user = new User();
        user.username = username;
        user.password = password;
        user.nickname = nickname;
        user.userEmail = userEmail;
        user.role = UserRole.USER;
        user.address = address;
        user.location = location;
        user.provider = OAuthProvider.LOCAL;
        return user;
    }

    /**
     * 소셜 로그인 사용자 생성 팩토리 메서드
     * password 는 null, location 은 빈 좌표로 초기화한다.
     */
    public static User ofSocial(
        OAuthProvider provider,
        String providerId,
        String nickname,
        String userEmail,
        String profileImageUrl,
        String address
    ) {
        User user = new User();
        user.username = provider.name().toLowerCase() + "_" + providerId;
        user.password = null;
        user.nickname = nickname;
        user.userEmail = userEmail;
        user.role = UserRole.USER;
        user.address = address;
        user.provider = provider;
        user.providerId = providerId;
        user.profileImageUrl = profileImageUrl;
        // 소셜 가입 시 주소가 미정인 경우 임시 좌표(0,0) 사용 — 주소 등록 후 업데이트 필요
        user.location = new GeometryFactory().createPoint(
            new org.locationtech.jts.geom.Coordinate(0, 0)
        );
        user.location.setSRID(4326);
        user.emailVerified = true;
        return user;
    }

    public void verifyEmail() {
        this.emailVerified = true;
    }

    public User updateUser
        (
            String nickname,
            String userEmail,
            String address,
            Point location,
            String newPassword
        ) {
        this.nickname = nickname;
        this.password = newPassword;
        this.address = address;
        this.location = location;
        this.userEmail = userEmail;
        return this;
    }

}
