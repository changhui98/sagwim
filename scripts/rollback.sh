#!/usr/bin/env bash
# =====================================================
# SAGWIM 롤백 스크립트
#
# 사용법:
#   ./scripts/rollback.sh [be|fe] <이전_태그>
#   ./scripts/rollback.sh be 20260429-def5678
# =====================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

TARGET="${1:-}"
ROLLBACK_TAG="${2:-}"

if [[ -z "$TARGET" || -z "$ROLLBACK_TAG" ]]; then
    log_error "사용법: $0 [be|fe] <이전_태그>"
    echo "사용 가능한 이미지:"
    docker images --filter "reference=sagwim-*" --format "{{.Repository}}:{{.Tag}} ({{.CreatedSince}})"
    exit 1
fi

set -a; source "$ENV_FILE"; set +a

log_info "롤백 시작: $TARGET → 태그 $ROLLBACK_TAG"

if [[ "$TARGET" == "be" ]]; then
    BLUE_CONTAINER="sagwim-backend-blue"
    IMAGE="sagwim-backend:$ROLLBACK_TAG"

    if ! docker image inspect "$IMAGE" > /dev/null 2>&1; then
        log_error "롤백 대상 이미지 '$IMAGE' 가 없습니다."
        docker images --filter "reference=sagwim-backend" --format "{{.Tag}}"
        exit 1
    fi

    log_info "현재 Blue 컨테이너 중지..."
    docker stop "$BLUE_CONTAINER" 2>/dev/null || true
    docker rm "$BLUE_CONTAINER" 2>/dev/null || true

    log_info "이전 버전($ROLLBACK_TAG) 기동..."
    docker run -d \
        --name "$BLUE_CONTAINER" \
        --network sagwim_sagwim-net \
        --env-file "$ENV_FILE" \
        -e SPRING_PROFILES_ACTIVE=prod \
        -e POSTGRES_HOST=sagwim-postgres \
        -e REDIS_HOST=sagwim-redis \
        -e IMAGE_UPLOAD_DIR=/app/uploads/images \
        -v sagwim_uploads_data:/app/uploads \
        --restart unless-stopped \
        "$IMAGE"

    log_ok "백엔드 롤백 완료: $ROLLBACK_TAG"

elif [[ "$TARGET" == "fe" ]]; then
    CONTAINER="sagwim-frontend"
    IMAGE="sagwim-frontend:$ROLLBACK_TAG"

    if ! docker image inspect "$IMAGE" > /dev/null 2>&1; then
        log_error "롤백 대상 이미지 '$IMAGE' 가 없습니다."
        exit 1
    fi

    docker stop "$CONTAINER" 2>/dev/null || true
    docker rm "$CONTAINER" 2>/dev/null || true

    docker run -d \
        --name "$CONTAINER" \
        --network sagwim_sagwim-net \
        -p 80:80 \
        -v sagwim_uploads_data:/app/uploads:ro \
        --restart unless-stopped \
        "$IMAGE"

    log_ok "프론트엔드 롤백 완료: $ROLLBACK_TAG"
else
    log_error "대상은 be 또는 fe여야 합니다."
    exit 1
fi

echo ""
docker ps --filter "name=sagwim" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
