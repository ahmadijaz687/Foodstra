#!/usr/bin/env bash
# Restore a FoodStra MySQL backup produced by backup.sh.
#
#   MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 MYSQL_USER=foodstra \
#   MYSQL_PASSWORD=foodstra MYSQL_DATABASE=foodstra ./restore.sh <backup.sql.gz>
set -euo pipefail

HOST="${MYSQL_HOST:-127.0.0.1}"
PORT="${MYSQL_PORT:-3306}"
USER="${MYSQL_USER:-foodstra}"
PASSWORD="${MYSQL_PASSWORD:-foodstra}"
DATABASE="${MYSQL_DATABASE:-foodstra}"
BACKUP_FILE="${1:?Usage: restore.sh <backup.sql.gz>}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

echo "Restoring ${BACKUP_FILE} -> ${DATABASE} on ${HOST}:${PORT}"
mysql --host="$HOST" --port="$PORT" --user="$USER" --password="$PASSWORD" \
  -e "CREATE DATABASE IF NOT EXISTS \`${DATABASE}\` CHARACTER SET utf8mb4;"

gunzip -c "$BACKUP_FILE" | mysql \
  --host="$HOST" --port="$PORT" \
  --user="$USER" --password="$PASSWORD" \
  --default-character-set=utf8mb4 \
  "$DATABASE"

echo "Restore complete."
