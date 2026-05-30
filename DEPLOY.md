# 部署方案

## 服务器环境

- 系统：Ubuntu 24.04.2 LTS
- Node.js：v22.22.2
- Docker：v29.3.1
- 反向代理：Caddy（自动 HTTPS）
- 域名：https://duoban.xyz/

## 部署架构

```
[Caddy :80/:443] → [Docker Container :3000] → [Next.js App]
                                            → [SQLite ./prisma/prod.db]
```

## 部署步骤

### 1. 配置 Caddy 反向代理

```bash
sudo nano /etc/caddy/Caddyfile
```

添加：
```
duoban.xyz {
    reverse_proxy localhost:3000
}
```

```bash
sudo systemctl reload caddy
```

### 2. 上传项目文件

将项目上传至 `/var/www/daily-task-group/`

需要包含以下文件：

**Dockerfile**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --production=false
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --production
EXPOSE 3000
CMD ["npm", "start"]
```

**.env.production**
```env
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="<运行时生成>"
```

生成 JWT_SECRET：`openssl rand -base64 32`

**docker-compose.yml**
```yaml
version: '3.8'
services:
  app:
    build: .
    restart: unless-stopped
    volumes:
      - ./data:/app/prisma
    env_file:
      - .env.production
```

### 3. 构建并启动

```bash
cd /var/www/daily-task-group
mkdir -p data
docker compose up -d --build
```

### 4. 初始化数据库

```bash
docker compose exec app npx prisma db push
docker compose exec app npx prisma db seed
```

### 5. 验证

```bash
# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f

# 测试访问
curl -I https://duoban.xyz/
```

## 常用命令

```bash
docker compose up -d          # 启动
docker compose down            # 停止
docker compose restart         # 重启
docker compose logs -f         # 查看日志
docker compose exec app sh     # 进入容器
```

## 数据备份

SQLite 数据文件在 `./data/dev.db`，备份：

```bash
cp ./data/dev.db ./data/dev.db.bak.$(date +%Y%m%d)
```

## 注意事项

- 磁盘空间 40G 已用 74%，定期清理 Docker 镜像：`docker system prune`
- 内存 1.6G 较紧张，避免运行过多容器
- 数据库文件通过 volume 挂载，容器重建不丢失数据
