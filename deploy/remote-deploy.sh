#!/usr/bin/env bash
# 服务器侧部署脚本（由 GitHub Actions 上传产物后通过 SSH 调用）
# 用法：bash remote-deploy.sh <git-sha>
# 前置：产物已解包到 /var/www/rike/releases/<git-sha>/
set -euo pipefail

SHA="${1:?用法: remote-deploy.sh <git-sha>}"
BASE=/var/www/rike
REL="$BASE/releases/$SHA"
export PATH=/root/.nvm/versions/node/v22.22.3/bin:$PATH

echo "=== rike deploy $SHA $(date '+%F %T') ==="

[ -f "$REL/server.js" ] || { echo "产物不完整：$REL/server.js 不存在"; exit 1; }
[ -f "$BASE/shared/.env" ] || { echo "缺少 $BASE/shared/.env（见 deploy/README.md）"; exit 1; }

# PM2 配置跟随仓库走，每次部署同步一份
cp -f "$REL/deploy/ecosystem.config.js" "$BASE/shared/ecosystem.config.js"

# 切软链：PM2 始终通过 current 启动
ln -sfn "$REL" "$BASE/current"

cd "$BASE"
pm2 startOrReload "$BASE/shared/ecosystem.config.js" --update-env
pm2 save

# 健康检查
code=""
for _ in 1 2 3 4 5 6 7 8 9 10; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 http://127.0.0.1:3000/login || true)
  [ "$code" = "200" ] && break
  sleep 2
done

if [ "$code" != "200" ]; then
  echo "健康检查失败（/login -> ${code:-无响应}），最近日志："
  pm2 logs rike --lines 30 --nostream || true
  exit 1
fi
echo "健康检查通过（/login -> 200）"

# 只保留最近 5 个版本
ls -1dt "$BASE"/releases/* 2>/dev/null | tail -n +6 | xargs -r rm -rf

rm -f "$BASE/incoming/rike-release.tar.gz"
echo "=== RIKE_DEPLOY_DONE $SHA $(date '+%F %T') ==="
