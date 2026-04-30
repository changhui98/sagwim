package com.peopleground.sagwim.global.security.jwt;

import com.peopleground.sagwim.user.domain.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * UPDATE: 2026. 3. 29
 * FROM : Chang Hee
 */
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    // jjwt 0.12.x: Key → SecretKey, SignatureAlgorithm enum 제거됨
    private SecretKey key;

    @Value("${jwt.expiration}")
    private Duration validity;

    public static final String BEARER_PREFIX = "Bearer ";

    @PostConstruct
    private void getSigningKey() {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        key = Keys.hmacShaKeyFor(bytes);
    }

    /**
     *  CREATE TOKEN ( id: 사용자 식별자 | username : 사용자 이름 | role : 사용자 권한 )
     */
    public String createToken(UUID id, String username, UserRole roles) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + validity.toMillis());

        // jjwt 0.12.x: Jwts.claims() 빌더 방식 → subject(), claim() 체이닝 방식으로 변경
        return BEARER_PREFIX + Jwts.builder()
            .subject(id.toString())
            .claim("username", username)
            .claim("roles", roles.toString())
            .issuedAt(now)
            .expiration(expirationDate)
            .signWith(key)
            .compact();
    }

    /**
     * Authorization Header 에서 토큰 추출
     */
    public String resolveToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }

        return null;
    }

    /**
     * JWT 토큰 검증
     * 토큰 위조/ 만료 여부 확인
     */
    public boolean validateToken(String token) {
        try {
            // jjwt 0.12.x: parserBuilder() → parser(), setSigningKey() → verifyWith(), parseClaimsJws() → parseSignedClaims()
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);

            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * JWT에서 Claims 추출
     */
    public Claims parseClaims(String token) {

        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public UUID getUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public String getUsername(String token) {
        return parseClaims(token).get("username", String.class);
    }

    public String getRoles(String token) {
        return parseClaims(token).get("roles", String.class);
    }

    /**
     * 토큰의 남은 만료 시간을 밀리초 단위로 반환
     */
    public long getRemainingExpiration(String token) {
        Date expiration = parseClaims(token).getExpiration();
        return expiration.getTime() - System.currentTimeMillis();
    }
}
