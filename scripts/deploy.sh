#!/usr/bin/env bash
# =====================================================
# SAGWIM Blue-Green 무중단 배포 스크립트
#
# 동작 방식:
#   1. 새 이미지로 Green 컨테이너 기동
#   2. Green 헬스체크 통과 확인
#   3. Blue 컨테이너 중지 및 제거
#   4. Green → Blue 이름 변경 (Nginx upstream 재참조)
#   5. Nginx 무중단 reload (SIGHUP)
#
# 사용법:
#   ./scripts/deploy.sh [be|fe|all] [이미지태그]
#   ./scripts/deploy.sh be 20260430-abc1234
#   ./scripts/deploy.sh all latest
# =====================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# =====================================================
# 인자 파싱
# =====================================================
TARGET="${1:-all}"   # be | fe | all
TAG="${2:-latest}"

if [[ ! "$TARGET" =~ ^(be|fe|all)$ ]]; then
    log_error "첫 번째 인자는 be, fe, all 중 하나여야 합니다."
    exit 1
fi

# .env 파일 로드
if [[ ! -f "$ENV_FILE" ]]; then
    log_error ".env 파일이 없습니다. .env.example을 복사하여 생성하세요."
    exit 1
fi
set -a; source "$ENV_FILE"; set +a

# =====================================================
# 헬스체크 함수
# health_check <container_name> <url> <timeout_sec>
# =====================================================
health_check() {
    local container="$1"
    local url="$2"
    local timeout="${3:-90}"
    local elapsed=0
    local interval=5

    log_info "헬스체크 대기: $container ($url)"
    while [[ $elapsed -lt $timeout ]]; do
        if docker exec "$container" wget -qO- "$url" > /dev/null 2>&1; then
            log_ok "$container 헬스체크 통과 (${elapsed}s)"
            return 0
        fi
        sleep $interval
        elapsed=$((elapsed + interval))
        echo -n "."
    done
    echo ""
    log_error "$container 헬스체크 실패 (${timeout}s 초과)"
    return 1
}

# =====================================================
# 백엔드 Blue-Green 배포
# =====================================================
deploy_backend() {
    local image_tag="$1"
    local blue="sagwim-backend-blue"
    local green="sagwim-backend-green"
    local image="sagwim-backend:$image_tag"

    log_info "===== 백엔드 배포 시작 (태그: $image_tag) ====="

    # 이미지 존재 확인
    if ! docker image inspect "$image" > /dev/null 2>&1; then
        log_error "이미지 '$image' 가 존재하지 않습니다. 먼저 빌드하세요."
        exit 1
    fi

    # Green 컨테이너 시작
    log_info "Green 컨테이너 기동 중..."
    docker run -d \
        --name "$green" \
        --network sagwim_sagwim-net \
        --network-alias backend \
        --env-file "$ENV_FILE" \
        -e SPRING_PROFILES_ACTIVE=prod \
        -e POSTGRES_HOST=sagwim-postgres \
        -e REDIS_HOST=sagwim-redis \
        -e IMAGE_UPLOAD_DIR=/app/uploads/images \
        -v sagwim_uploads_data:/app/uploads \
        --health-cmd="wget -qO- http://localhost:8080/actuator/health || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        --health-start-period=60s \
        "$image"

    # Green 헬스체크 대기
    if ! health_check "$green" "http://localhost:8080/actuator/health" 120; then
        log_error "Green 배포 실패. 롤백합니다."
        docker rm -f "$green" 2>/dev/null || true
        exit 1
    fi

    # Blue 종료 및 제거
    if docker ps -q -f name="$blue" | grep -q .; then
        log_info "Blue 컨테이너 중지 중..."
        docker stop "$blue"
        docker rm "$blue"
        log_ok "Blue 컨테이너 제거 완료"
    fi

    # Green → Blue 이름 변경
    docker rename "$green" "$blue"
    log_ok "Green → Blue 이름 변경 완료"

    log_ok "===== 백엔드 배포 완료 ====="
}

# =====================================================
# 프론트엔드 배포 (Nginx 무중단 reload)
# =====================================================
deploy_frontend() {
    local image_tag="$1"
    local container="sagwim-frontend"
    local image="sagwim-frontend:$image_tag"

    log_info "===== 프론트엔드 배포 시작 (태그: $image_tag) ====="

    if ! docker image inspect "$image" > /dev/null 2>&1; then
        log_error "이미지 '$image' 가 존재하지 않습니다. 먼저 빌드하세요."
        exit 1
    fi

    # 기존 컨테이너가 있으면 교체 (프론트는 다운타임 최소화: 수 초)
    if docker ps -q -f name="$container" | grep -q .; then
        log_info "기존 프론트엔드 컨테이너 교체 중..."
        docker stop "$container"
        docker rm "$container"
    fi

    docker run -d \
        --name "$container" \
        --network sagwim_sagwim-net \
        -p 80:80 \
        -v sagwim_uploads_data:/app/uploads:ro \
        --restart unless-stopped \
        "$image"

    if ! health_check "$container" "http://localhost:80/health" 30; then
        log_error "프론트엔드 헬스체크 실패"
        exit 1
    fi

    log_ok "===== 프론트엔드 배포 완료 ====="
}

# =====================================================
# 이미지 빌드 함수
# =====================================================
build_images() {
    local tag="$1"
    local target="$2"

    if [[ "$target" == "be" || "$target" == "all" ]]; then
        log_info "백엔드 이미지 빌드 중 (sagwim-backend:$tag)..."
        docker build \
            -t "sagwim-backend:$tag" \
            -t "sagwim-backend:latest" \
            "$PROJECT_ROOT/com.peopleground.sagwim.be"
        log_ok "백엔드 이미지 빌드 완료"
    fi

    if [[ "$target" == "fe" || "$target" == "all" ]]; then
        log_info "프론트엔드 이미지 빌드 중 (sagwim-frontend:$tag)..."
        docker build \
            -t "sagwim-frontend:$tag" \
            -t "sagwim-frontend:latest" \
            "$PROJECT_ROOT/com.peopleground.sagwim.fe"
        log_ok "프론트엔드 이미지 빌드 완료"
    fi
}

# =====================================================
# 인프라(DB, Redis) 기동 확인
# =====================================================
ensure_infra() {
    log_info "인프라 컨테이너 상태 확인..."

    local postgres_running
    postgres_running=$(docker ps -q -f name="sagwim-postgres" 2>/dev/null || true)

    if [[ -z "$postgres_running" ]]; then
        log_warn "PostgreSQL이 실행 중이 아닙니다. 인프라를 먼저 시작합니다..."
        docker compose -f "$COMPOSE_FILE" up -d postgres redis
        log_info "PostgreSQL 준비 대기 중..."
        sleep 15
    fi

    log_ok "인프라 준비 완료"
}

# =====================================================
# 오래된 이미지 정리
# =====================================================
cleanup_old_images() {
    log_info "사용하지 않는 이미지 정리 중..."
    docker image prune -f --filter "until=168h" 2>/dev/null || true
    log_ok "이미지 정리 완료"
}

# =====================================================
# 메인 실행
# =====================================================
main() {
    log_info "SAGWIM 배포 시작 (대상: $TARGET, 태그: $TAG)"
    echo "=================================================="

    # 이미지 빌드
    build_images "$TAG" "$TARGET"

    # 인프라 확인
    ensure_infra

    # 배포 실행
    if [[ "$TARGET" == "be" || "$TARGET" == "all" ]]; then
        deploy_backend "$TAG"
    fi

    if [[ "$TARGET" == "fe" || "$TARGET" == "all" ]]; then
        deploy_frontend "$TAG"
    fi

    # 정리
    cleanup_old_images

    echo "=================================================="
    log_ok "배포 완료!"
    echo ""
    docker ps --filter "name=sagwim" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

main
