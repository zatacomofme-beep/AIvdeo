# ========================================
# AI视频生成项目 - 火山云部署脚本
# ========================================

$ErrorActionPreference = "Stop"
$ServerIP = "115.190.137.87"
$ServerUser = "root"
$ProjectPath = "C:\Users\Administrator\Desktop\AIvdeo"
$TempArchive = "aivideo_deploy.tar.gz"
$ServerProjectPath = "/root/aivideo"  # 使用现有的路径结构

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始部署到火山云服务器..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 检查 SSH 连接
Write-Host "`n[1/6] 测试服务器连接..." -ForegroundColor Yellow
try {
    ssh ${ServerUser}@${ServerIP} "echo '连接成功'"
    if ($LASTEXITCODE -ne 0) {
        throw "SSH连接失败"
    }
    Write-Host "✓ 服务器连接正常" -ForegroundColor Green
} catch {
    Write-Host "✗ 无法连接到服务器，请检查:" -ForegroundColor Red
    Write-Host "  1. 服务器IP是否正确: $ServerIP" -ForegroundColor Yellow
    Write-Host "  2. SSH密钥是否已配置" -ForegroundColor Yellow
    Write-Host "  3. 服务器防火墙是否开放22端口" -ForegroundColor Yellow
    exit 1
}

# 打包项目代码
Write-Host "`n[2/6] 打包项目代码..." -ForegroundColor Yellow
cd $ProjectPath

# 检查是否安装了 tar (Git for Windows 自带)
$tarPath = Get-Command tar -ErrorAction SilentlyContinue
if (-not $tarPath) {
    Write-Host "✗ 未找到 tar 命令，请安装 Git for Windows" -ForegroundColor Red
    exit 1
}

Write-Host "正在打包，排除以下目录:" -ForegroundColor Gray
Write-Host "  - node_modules/" -ForegroundColor Gray
Write-Host "  - .git/" -ForegroundColor Gray
Write-Host "  - dist/" -ForegroundColor Gray
Write-Host "  - backend/venv/" -ForegroundColor Gray
Write-Host "  - .venv/" -ForegroundColor Gray

tar --exclude='node_modules' `
    --exclude='.git' `
    --exclude='dist' `
    --exclude='backend/venv' `
    --exclude='.venv' `
    --exclude='*.log' `
    --exclude='.env' `
    -czf $TempArchive .

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $TempArchive).Length / 1MB
    Write-Host "✓ 打包完成，文件大小: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "✗ 打包失败" -ForegroundColor Red
    exit 1
}

# 上传到服务器
Write-Host "`n[3/6] 上传代码到服务器..." -ForegroundColor Yellow
scp $TempArchive ${ServerUser}@${ServerIP}:/tmp/
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 上传完成" -ForegroundColor Green
} else {
    Write-Host "✗ 上传失败" -ForegroundColor Red
    exit 1
}

# 清理本地临时文件
Remove-Item $TempArchive -Force
Write-Host "✓ 清理本地临时文件" -ForegroundColor Green

# 在服务器上解压并部署
Write-Host "`n[4/6] 在服务器上解压代码..." -ForegroundColor Yellow

# 创建部署脚本文件
$tempScript = "$env:TEMP\deploy_temp.sh"
$scriptContent = @"
set -e

echo '=== 步骤1: 备份现有配置 ==='
if [ -f /root/backend/.env ]; then
    cp /root/backend/.env /tmp/backend.env.backup
    echo '✓ 已备份 .env 配置文件'
else
    echo '⚠ 未找到现有 .env 文件'
fi

if [ -d /root/backend/venv ]; then
    echo '⚠ 检测到现有虚拟环境,将在部署脚本中重新创建'
fi

echo ''
echo '=== 步骤2: 清理旧代码 (保留备份) ==='
echo '清理前端文件...'
rm -rf /root/src /root/dist /root/node_modules
rm -f /root/package.json /root/package-lock.json
rm -f /root/vite.config.ts /root/tailwind.config.js
rm -f /root/postcss.config.mjs /root/index.html
echo '✓ 前端文件已清理'

echo '清理后端文件 (保留 .env 备份)...'
if [ -d /root/backend ]; then
    rm -rf /root/backend
    echo '✓ 后端文件已清理'
fi

echo ''
echo '=== 步骤3: 解压新代码 ==='
mkdir -p /root
cd /root
tar -xzf /tmp/aivideo_deploy.tar.gz -C /root/
echo '✓ 新代码已解压到 /root/'

echo ''
echo '=== 步骤4: 恢复配置文件 ==='
if [ -f /tmp/backend.env.backup ]; then
    mkdir -p /root/backend
    cp /tmp/backend.env.backup /root/backend/.env
    rm -f /tmp/backend.env.backup
    echo '✓ 已恢复 .env 配置'
else
    echo '⚠ 未找到 .env 备份,需要手动配置'
fi

echo ''
echo '=== 步骤5: 设置权限 ==='
chown -R root:root /root
chmod -R 755 /root
rm -f /tmp/aivideo_deploy.tar.gz

echo ''
echo '✓ 代码部署完成！'
echo ''
echo '📁 当前路径结构:'
ls -la /root/ | grep -E '(src|backend|package.json|index.html)' || echo '  (文件列表)'
echo ''
echo '⚙️  后端配置状态:'
if [ -f /root/backend/.env ]; then
    echo '  ✓ .env 文件已就绪'
else
    echo '  ✗ 需要配置 .env 文件'
fi
"@

$scriptContent | Out-File -FilePath $tempScript -Encoding UTF8

# 上传脚本到服务器
scp $tempScript ${ServerUser}@${ServerIP}:/tmp/deploy_temp.sh
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 上传部署脚本失败" -ForegroundColor Red
    Remove-Item $tempScript -Force
    exit 1
}

# 执行脚本
ssh ${ServerUser}@${ServerIP} "bash /tmp/deploy_temp.sh"
$deployResult = $LASTEXITCODE

# 清理临时文件
Remove-Item $tempScript -Force
ssh ${ServerUser}@${ServerIP} "rm -f /tmp/deploy_temp.sh" 2>$null

if ($deployResult -eq 0) {
    Write-Host "✓ 代码解压完成" -ForegroundColor Green
} else {
    Write-Host "✗ 解压失败" -ForegroundColor Red
    exit 1
}

# 检查环境变量文件
Write-Host "`n[5/6] 检查环境配置..." -ForegroundColor Yellow
$envCheck = ssh ${ServerUser}@${ServerIP} "if [ -f /root/backend/.env ]; then echo 'exists'; else echo 'missing'; fi"

if ($envCheck -match "missing") {
    Write-Host "⚠ 警告: 未找到 backend/.env 文件" -ForegroundColor Yellow
    Write-Host "  请稍后配置数据库和API密钥" -ForegroundColor Yellow
    
    # 创建 .env 模板文件
    $envTemplateContent = @"
# 数据库配置
DATABASE_URL=postgresql://用户名:密码@192.168.19.67:5432/aivideo

# 火山云TOS对象存储
TOS_ACCESS_KEY=您的TOS访问密钥
TOS_SECRET_KEY=您的TOS秘密密钥
TOS_BUCKET=您的桶名称
TOS_ENDPOINT=tos-cn-beijing.volces.com
TOS_REGION=cn-beijing

# API密钥
OPENAI_API_KEY=您的OpenAI密钥
SORA2_API_KEY=您的Sora2密钥
SORA2_API_URL=https://api.sora2.com

# JWT密钥
SECRET_KEY=请替换为随机生成的密钥

# 服务器配置
HOST=0.0.0.0
PORT=8000
"@
    
    $tempEnvFile = "$env:TEMP\env_template.txt"
    $envTemplateContent | Out-File -FilePath $tempEnvFile -Encoding UTF8
    
    scp $tempEnvFile ${ServerUser}@${ServerIP}:/root/backend/.env.example
    Remove-Item $tempEnvFile -Force
    
    Write-Host "  ✓ 已创建 .env.example 模板" -ForegroundColor Green
    Write-Host "  请执行: cp /root/backend/.env.example /root/backend/.env && vi /root/backend/.env" -ForegroundColor Yellow
} else {
    Write-Host "✓ 环境配置文件已存在" -ForegroundColor Green
}

# 提供下一步操作指引
Write-Host "`n[6/6] 部署准备完成！" -ForegroundColor Green
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "接下来请执行以下步骤:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n1️⃣  配置环境变量 (如果还没配置):" -ForegroundColor Yellow
Write-Host "   ssh root@$ServerIP" -ForegroundColor Gray
Write-Host "   vi /root/backend/.env" -ForegroundColor Gray

Write-Host "`n2️⃣  上传并运行部署脚本:" -ForegroundColor Yellow
Write-Host "   scp C:\Users\Administrator\Desktop\AIvdeo\deploy_server.sh root@$ServerIP:/root/" -ForegroundColor Gray
Write-Host "   ssh root@$ServerIP" -ForegroundColor Gray
Write-Host "   bash /root/deploy_server.sh" -ForegroundColor Gray

Write-Host "`n3️⃣  检查部署状态:" -ForegroundColor Yellow
Write-Host "   pm2 status" -ForegroundColor Gray
Write-Host "   systemctl status nginx" -ForegroundColor Gray

Write-Host "`n4️⃣  查看访问地址:" -ForegroundColor Yellow
Write-Host "   http://semopic.com" -ForegroundColor Green
Write-Host "   http://www.semopic.com" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "代码已成功上传到服务器！✨" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
