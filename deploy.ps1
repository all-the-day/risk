# 部署脚本 - 在项目根目录运行

$SERVER = "root@101.132.34.193"
$REMOTE_DIR = "/var/www/rike"

Write-Host "=== 开始部署 ===" -ForegroundColor Green

# 1. 打包文件
Write-Host "1. 打包文件..." -ForegroundColor Yellow
Compress-Archive -Path app, components, db, lib, prisma, services, types, public, package.json, package-lock.json, next.config.js, tsconfig.json, postcss.config.mjs, update-server.sh -DestinationPath rike.zip -Force

# 2. 上传到服务器
Write-Host "2. 上传到服务器..." -ForegroundColor Yellow
scp rike.zip ${SERVER}:${REMOTE_DIR}/

# 3. 执行服务器更新脚本
Write-Host "3. 执行更新..." -ForegroundColor Yellow
ssh $SERVER "cd ${REMOTE_DIR} && chmod +x update-server.sh && bash update-server.sh"

# 4. 清理本地文件
Remove-Item rike.zip

Write-Host "=== 部署完成 ===" -ForegroundColor Green
Write-Host "访问: https://cccc.duoban.xyz/" -ForegroundColor Cyan
