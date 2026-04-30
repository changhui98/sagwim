# =====================================================
# Stage 1: 빌드
# =====================================================
FROM eclipse-temurin:25-jdk-alpine AS builder

WORKDIR /workspace

# Gradle Wrapper 및 의존성 캐시를 먼저 복사 (레이어 캐시 최적화)
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# 의존성 다운로드 (소스 변경 없을 때 캐시 재사용)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon 2>/dev/null || true

# 소스 복사 후 빌드 (테스트 제외 - CI에서 별도 수행)
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

# =====================================================
# Stage 2: 런타임 (최소 이미지)
# =====================================================
FROM eclipse-temurin:25-jre-alpine AS runtime

# 보안: non-root 사용자
RUN addgroup -S sagwim && adduser -S sagwim -G sagwim

WORKDIR /app

# 업로드 디렉토리 생성 (볼륨 마운트 대상)
RUN mkdir -p /app/uploads/images && chown -R sagwim:sagwim /app

# 빌드 산출물 복사
COPY --from=builder /workspace/build/libs/*.jar app.jar
RUN chown sagwim:sagwim app.jar

USER sagwim

# 헬스체크 - Spring Boot Actuator /actuator/health 엔드포인트
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", \
    "-Duser.timezone=UTC", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", "app.jar"]
