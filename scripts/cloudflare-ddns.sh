#!/usr/bin/env bash
# =====================================================
# Cloudflare DDNS 자동 갱신 스크립트
#
# 현재 공인 IP를 감지하고, Cloudflare DNS A 레코드와
# 다를 경우에만 API를 호출하여 갱신합니다.
#
# 사용법:
#   ./scripts/cloudflare-ddns.sh
#
# 환경변수 (직접 설정하거나 .env 파일에 추가):
#   CF_API_TOKEN  : Cloudflare API 토큰 (Edit zone DNS 권한)
#   CF_ZONE_ID    : sagwim.com의 Zone ID
#   CF_RECORD_ID  : sagwim.com A 레코드의 Record ID
#   CF_RECORD_NAME: A 레코드 이름 (기본값: sagwim.com)
#
# crontab 등록 방법:
#   crontab -e
#   */5 * * * * /path/to/scripts/cloudflare-ddns.sh >> /var/log/cloudflare-ddns.log 2>&1
# =====================================================

set -euo pipefail

# ─── 설정 ───────────────────────────────────────────
CF_API_TOKEN="${CF_API_TOKEN:-}"
CF_ZONE_ID="${CF_ZONE_ID:-}"
CF_RECORD_ID="${CF_RECORD_ID:-}"
CF_RECORD_NAME="${CF_RECORD_NAME:-sagwim.com}"
CF_PROXIED="${CF_PROXIED:-true}"   # Cloudflare 프록시 ON 유지
CF_TTL="${CF_TTL:-1}"              # 1 = Auto (프록시 ON일 때 자동 설정됨)
# ────────────────────────────────────────────────────

# .env 파일이 있으면 로드 (스크립트 위치 기준 상위 디렉토리)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$(dirname "$SCRIPT_DIR")/.env"
if [[ -f "$ENV_FILE" ]]; then
    # CF_ 관련 변수만 소싱 (기존 변수 덮어쓰지 않음)
    set -a
    # shellcheck disable=SC1090
    grep -E '^CF_' "$ENV_FILE" | while IFS= read -r line; do
        export "$line"
    done 2>/dev/null || true
    set +a
    # subshell 문제 우회: grep 결과를 직접 eval
    while IFS= read -r line; do
        [[ "$line" =~ ^CF_ ]] && export "$line" || true
    done < <(grep -E '^CF_' "$ENV_FILE" 2>/dev/null || true)
fi

# 필수 변수 확인
if [[ -z "$CF_API_TOKEN" || -z "$CF_ZONE_ID" || -z "$CF_RECORD_ID" ]]; then
    echo "[ERROR] CF_API_TOKEN, CF_ZONE_ID, CF_RECORD_ID 를 모두 설정해야 합니다."
    echo "        .env 파일 또는 환경변수로 제공하세요."
    exit 1
fi

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] [cloudflare-ddns]"

# ─── 현재 공인 IP 감지 ──────────────────────────────
# 여러 외부 서비스를 순서대로 시도하여 안정성 확보
get_public_ip() {
    local ip=""
    # 1순위: Cloudflare
    ip=$(curl -s --max-time 5 "https://1.1.1.1/cdn-cgi/trace" | grep "ip=" | cut -d= -f2) && [[ -n "$ip" ]] && echo "$ip" && return
    # 2순위: ipify
    ip=$(curl -s --max-time 5 "https://api.ipify.org") && [[ -n "$ip" ]] && echo "$ip" && return
    # 3순위: ifconfig.me
    ip=$(curl -s --max-time 5 "https://ifconfig.me") && [[ -n "$ip" ]] && echo "$ip" && return
    echo ""
}

CURRENT_IP=$(get_public_ip)
if [[ -z "$CURRENT_IP" ]]; then
    echo "$LOG_PREFIX [ERROR] 공인 IP 감지 실패. 네트워크를 확인하세요."
    exit 1
fi

# ─── Cloudflare에 등록된 현재 A 레코드 IP 조회 ───────
CF_RESPONSE=$(curl -s --max-time 10 \
    -X GET "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${CF_RECORD_ID}" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json")

CF_SUCCESS=$(echo "$CF_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('success',False)).lower())" 2>/dev/null || echo "false")
if [[ "$CF_SUCCESS" != "true" ]]; then
    echo "$LOG_PREFIX [ERROR] Cloudflare API 조회 실패: $CF_RESPONSE"
    exit 1
fi

REGISTERED_IP=$(echo "$CF_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result']['content'])" 2>/dev/null || echo "")

# ─── IP가 같으면 갱신 불필요 ────────────────────────
if [[ "$CURRENT_IP" == "$REGISTERED_IP" ]]; then
    echo "$LOG_PREFIX [OK] IP 변경 없음 ($CURRENT_IP). 갱신 불필요."
    exit 0
fi

echo "$LOG_PREFIX [INFO] IP 변경 감지: $REGISTERED_IP → $CURRENT_IP. 갱신 중..."

# ─── Cloudflare A 레코드 업데이트 ────────────────────
UPDATE_RESPONSE=$(curl -s --max-time 10 \
    -X PATCH "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${CF_RECORD_ID}" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{
        \"type\": \"A\",
        \"name\": \"${CF_RECORD_NAME}\",
        \"content\": \"${CURRENT_IP}\",
        \"ttl\": ${CF_TTL},
        \"proxied\": ${CF_PROXIED}
    }")

UPDATE_SUCCESS=$(echo "$UPDATE_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('success',False)).lower())" 2>/dev/null || echo "false")

if [[ "$UPDATE_SUCCESS" == "true" ]]; then
    echo "$LOG_PREFIX [OK] Cloudflare A 레코드 갱신 완료: ${CF_RECORD_NAME} → $CURRENT_IP"
else
    echo "$LOG_PREFIX [ERROR] Cloudflare A 레코드 갱신 실패: $UPDATE_RESPONSE"
    exit 1
fi
