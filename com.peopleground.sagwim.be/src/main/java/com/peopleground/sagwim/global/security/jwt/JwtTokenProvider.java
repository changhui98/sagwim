package com.peopleground.sagwim.global.security.jwt;

import com.peopleground.sagwim.user.domain.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.util.Date;
import java.util.UUID;
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

    private Key key;

    private final SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.HS256;

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
        Claims claims = Jwts.claims().setSubject(id.toString());
        claims.put("username", username);
        claims.put("roles", roles.toString());
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + validity.toMillis());

        return BEARER_PREFIX + Jwts.builder()
            .setClaims(claims)
            .setIssuedAt(now)
            .setExpiration(expirationDate)
            .signWith(key, signatureAlgorithm)
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
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);

            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * JWT에서 Claims 추출
     */
    public Claims parseClaims(String token) {

        return Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();
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
