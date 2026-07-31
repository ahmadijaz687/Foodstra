#!/usr/bin/env bash
# Logical backup of the FoodStra MySQL database via mysqldump.
# Works against the local docker-compose MySQL or any reachable host.
#
#   MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 MYSQL_USER=foodstra \
#   MYSQL_PASSWORD=foodstra MYSQL_DATABASE=foodstra ./backup.sh [out_dir]
set -euo pipefail

HOST="${MYSQL_HOST:-127.0.0.1}"
PORT="${MYSQL_PORT:-3306}"
USER="${MYSQL_USER:-foodstra}"
PASSWORD="${MYSQL_PASSWORD:-foodstra}"
DATABASE="${MYSQL_DATABASE:-foodstra}"
OUT_DIR="${1:-./backups}"

mkdir -p "$OUT_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="${OUT_DIR}/foodstra-${DATABASE}-${STAMP}.sql.gz"

echo "Backing up ${DATABASE} from ${HOST}:${PORT} -> ${OUT_FILE}"
mysqldump \
  --host="$HOST" --port="$PORT" \
  --user="$USER" --password="$PASSWORD" \
  --single-transaction --quick --routines --triggers --events \
  --default-character-set=utf8mb4 \
  "$DATABASE" | gzip -c > "$OUT_FILE"

echo "Backup complete: $(du -h "$OUT_FILE" | cut -f1) ${OUT_FILE}"
