#!/bin/bash
cd /var/www/rike

echo "=== 开始更新 ==="

# 解压文件
echo "1. 解压文件..."
unzip -o rike.zip
rm rike.zip

# 安装依赖
echo "2. 安装依赖..."
npm ci --production=false

# 生成 Prisma Client
echo "3. 生成 Prisma Client..."
npx prisma generate

# 推送数据库变更
echo "4. 更新数据库..."
npx prisma db push

# 构建
echo "5. 构建项目..."
npm run build

# 重启服务
echo "6. 重启服务..."
pm2 restart rike

echo "=== 更新完成 ==="
pm2 status
