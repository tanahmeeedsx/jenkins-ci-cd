#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="$HOME/noteshub"

cd "$APP_DIR"

trap 'docker logout >/dev/null 2>&1 || true' EXIT

if [[ ! -f .env ]]; then
    echo "ERROR: Deployment .env file is missing"
    exit 1
fi

if ! grep -Eq '^JWT_SECRET=.+$' .env; then
    echo "ERROR: JWT_SECRET is not configured"
    exit 1
fi

if ! grep -Eq '^DOCKERHUB_USER=.+$' .env; then
    echo "ERROR: DOCKERHUB_USER is not configured"
    exit 1
fi

if ! grep -Eq '^IMAGE_TAG=.+$' .env; then
    echo "ERROR: IMAGE_TAG is not configured"
    exit 1
fi

docker compose --env-file .env -f docker-compose.yml pull

docker compose --env-file .env -f docker-compose.yml up -d --remove-orphans

echo "Waiting for NotesHub API..."

for attempt in $(seq 1 30); do
    if curl -fsS http://127.0.0.1/api/health; then
        echo
        echo "NotesHub deployment successful"
        exit 0
    fi

    sleep 5
done

echo "ERROR: Application health check failed"

docker compose --env-file .env -f docker-compose.yml logs --tail=100

exit 1
