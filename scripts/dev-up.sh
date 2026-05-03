#!/bin/bash
# 개발 환경 DB 초기화 후 재기동 (매번 깨끗한 상태로 시작)
cd "$(dirname "$0")/.."
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d
