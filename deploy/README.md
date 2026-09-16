# 部署

**产物在 GitHub Actions 上构建，生产服务器只接收和解包。**
服务器只有 1.6G 内存（还与其它应用共享），**永远不要在服务器上跑 `npm ci` / `npm run build`** —— 2026-09-16 连续两次 OOM 拖死整机。

## 架构

```
push to main
   ↓ GitHub Actions (ubuntu-24.04, Node 22)
npm ci → prisma generate → next build(standalone) → rike-release.tar.gz
   ↓ scp
/var/www/rike/incoming/rike-release.tar.gz
   ↓ SSH: bash deploy/remote-deploy.sh <git-sha>
/var/www/rike/releases/<git-sha>/        ← 解包后的 standalone 产物
/var/www/rike/current → releases/<sha>   ← 软链
   ↓
pm2（shared/ecosystem.config.js，跑 current/server.js:3000）→ Caddy → duoban.xyz
```

| 路径 | 说明 |
|---|---|
| `releases/<sha>/` | 每次部署的产物，脚本自动保留最近 5 个 |
| `current` | 指向当前版本的软链（回滚就是改它） |
| `shared/.env` | **运行时环境变量的唯一真源**（DATABASE_URL / JWT_SECRET） |
| `shared/ecosystem.config.js` | 每次部署由脚本从产物同步 |
| `incoming/` | 上传的 tarball 落地处 |
| `data/prod.db` | SQLite 数据库，**不在 releases 里，部署永远不会碰到** |

## 一次性设置（服务器上执行）

1. 腾挪目录（旧的构建树不再需要，留着只当备份）：

```bash
mv /var/www/rike /root/rike-legacy-$(date +%Y%m%d)
mkdir -p /var/www/rike/{releases,shared,incoming,data}
```

2. 运行时环境变量：

```bash
cat > /var/www/rike/shared/.env <<'EOF'
DATABASE_URL="file:/var/www/rike/data/prod.db"
JWT_SECRET="换成自己生成的一串随机值"
EOF
chmod 600 /var/www/rike/shared/.env
```

3. 装 `sqlite3`（建库脚本用）：

```bash
apt-get install -y sqlite3
```

4. 清掉旧的重复 PM2 条目：

```bash
export PATH=/root/.nvm/versions/node/v22.22.3/bin:$PATH
pm2 delete rike; pm2 save
```

5. 生成 CI 专用 SSH 密钥，并加到 GitHub 仓库 Secrets（Settings → Secrets and variables → Actions）：

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f /root/.ssh/github_deploy -N ""
cat /root/.ssh/github_deploy.pub >> /root/.ssh/authorized_keys
```

需要的 Secrets：`SSH_HOST`（101.132.34.193）、`SSH_USER`（root）、`SSH_KEY`（`/root/.ssh/github_deploy` 私钥全文）、`SSH_PORT`（可省，默认 22）。

6. 首次部署 + 建库：

```bash
# 部署：push 到 main，或在 Actions 页面手动 Run workflow
bash /var/www/rike/shared/db-init.sh   # 应用 schema.sql + 灌管理员与周评模板
```

默认管理员账号 `admin` / `admin123`。

## 日常操作

```bash
export PATH=/root/.nvm/versions/node/v22.22.3/bin:$PATH

pm2 logs rike                 # 看日志
pm2 list                      # 看状态

# 回滚到某个旧版本
ln -sfn /var/www/rike/releases/<旧sha> /var/www/rike/current
pm2 startOrReload /var/www/rike/shared/ecosystem.config.js --update-env

# schema 变更后重建库（会清空数据，MVP 阶段可接受）
bash /var/www/rike/shared/db-init.sh --force
```

> `db-init.sh` 需要先成功部署过一次（`prisma/schema.sql`、`prisma/seed.cjs` 由 CI 生成并随产物发下来），所以服务器上不需要装 Prisma CLI 或 tsx。
