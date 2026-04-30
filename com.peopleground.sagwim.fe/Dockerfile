# =====================================================
# Stage 1: 빌드
# =====================================================
FROM node:22-alpine AS builder

WORKDIR /app

# 의존성 캐시 최적화 (package.json 변경 시에만 재설치)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# 소스 복사 및 빌드
COPY . .

# 빌드 시점 환경변수 (ARG로 받아 .env.production에 주입)
ARG VITE_API_BASE_URL=/api
ARG VITE_IMAGE_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_IMAGE_BASE_URL=$VITE_IMAGE_BASE_URL

RUN npm run build

# =====================================================
# Stage 2: Nginx 서빙
# =====================================================
FROM nginx:1.27-alpine AS runtime

# 보안: 불필요한 기본 설정 제거
RUN rm -rf /etc/nginx/conf.d/default.conf

# Nginx 설정 (SPA 라우팅 + API 프록시 포함)
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
