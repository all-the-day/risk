#!/usr/bin/env bash
# 服务器侧建库脚本：应用 schema.sql + 灌初始数据（管理员 + 周评模板）
# 数据文件来自当前 release（prisma/schema.sql、prisma/seed.cjs），无需在服务器上装任何依赖
# 用法：bash db-init.sh [--force]     不带 --force 时若库已存在会拒绝执行
set -euo pipefail

BASE=/var/www/rike
export PATH=/root/.nvm/versions/node/v22.22.3/bin:$PATH

[ -f "$BASE/shared/.env" ] || { echo "缺少 $BASE/shared/.env"; exit 1; }
set -a
. "$BASE/shared/.env"
set +a

[ -n "${DATABASE_URL:-}" ] || { echo "shared/.env 里没有 DATABASE_URL"; exit 1; }
DB_FILE=$(printf '%s' "$DATABASE_URL" | sed 's|^file:/*|/|')
case "$DB_FILE" in
  /*) ;;
  *) echo "DATABASE_URL 必须是绝对路径（当前：$DATABASE_URL）"; exit 1 ;;
esac

mkdir -p "$(dirname "$DB_FILE")"
if [ -f "$DB_FILE" ] && [ "${1:-}" != "--force" ]; then
  echo "$DB_FILE 已存在；要清库重建请加 --force（会丢数据）"
  exit 1
fi

cd "$BASE/current"
[ -f prisma/schema.sql ] || { echo "当前版本缺少 prisma/schema.sql，先部署一次"; exit 1; }

echo "建库：$DB_FILE"
rm -f "$DB_FILE"
sqlite3 "$DB_FILE" < prisma/schema.sql
node prisma/seed.cjs

echo "=== RIKE_DB_INIT_DONE $(date '+%F %T') ==="
