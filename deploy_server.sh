#!/bin/bash
# ========================================
# AI视频生成项目 - 服务器部署脚本
# 使用现有路径: /root/backend (后端) + /root/ (前端)
# ========================================

set -e

echo "========================================"
echo "开始部署 AI 视频生成项目"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

# 检查路径
if [ ! -d "/root/backend" ]; then
    log_error "未找到 /root/backend 目录，请先上传代码"
    exit 1
fi

# 1. 安装系统依赖
echo ""
echo "[1/9] 安装系统依赖..."
yum install -y epel-release
yum install -y git nginx postgresql-devel gcc gcc-c++ make openssl-devel bzip2-devel libffi-devel zlib-devel wget

log_info "系统依赖安装完成"

# 2. 安装 Node.js 18
echo ""
echo "[2/9] 检查 Node.js..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    echo "安装 Node.js 18..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi
node -v
npm -v
log_info "Node.js 准备就绪"

# 3. 安装 Python 3.9
echo ""
echo "[3/9] 检查 Python..."
if ! command -v python3.9 &> /dev/null; then
    echo "安装 Python 3.9..."
    cd /tmp
    wget https://www.python.org/ftp/python/3.9.18/Python-3.9.18.tgz
    tar -xzf Python-3.9.18.tgz
    cd Python-3.9.18
    ./configure --enable-optimizations
    make altinstall
    cd /root
fi
python3.9 --version
log_info "Python 准备就绪"

# 4. 安装 PM2
echo ""
echo "[4/9] 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
pm2 --version
log_info "PM2 安装完成"

# 5. 配置后端环境
echo ""
echo "[5/9] 配置后端 Python 环境..."
cd /root/backend

# 创建虚拟环境
if [ ! -d "venv" ]; then
    python3.9 -m venv venv
    log_info "创建虚拟环境"
fi

# 激活虚拟环境并安装依赖
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
log_info "后端依赖安装完成"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    log_warn "未找到 .env 文件，请配置后再启动服务"
    log_warn "示例: cp .env.example .env && vi .env"
else
    log_info "环境配置文件已存在"
fi

# 6. 启动后端服务
echo ""
echo "[6/9] 启动后端服务..."
pm2 delete aivideo-backend 2>/dev/null || true
pm2 start venv/bin/uvicorn --name aivideo-backend -- app.main:app --host 0.0.0.0 --port 8000
pm2 save
log_info "后端服务已启动 (端口 8000)"

# 7. 构建前端
echo ""
echo "[7/9] 构建前端..."
cd /root

# 检查前端源码
if [ ! -f "package.json" ]; then
    log_error "未找到 package.json，请确保前端代码已上传到 /root/"
    exit 1
fi

# 安装前端依赖
if [ ! -d "node_modules" ]; then
    npm install
fi

# 构建前端
npm run build
log_info "前端构建完成"

# 8. 配置 Nginx
echo ""
echo "[8/9] 配置 Nginx..."
cat > /etc/nginx/conf.d/semopic.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name semopic.com www.semopic.com;
    
    # 前端静态文件
    root /root/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

# 测试 Nginx 配置
nginx -t
if [ $? -eq 0 ]; then
    systemctl enable nginx
    systemctl restart nginx
    log_info "Nginx 配置完成"
else
    log_error "Nginx 配置错误"
    exit 1
fi

# 9. 配置防火墙
echo ""
echo "[9/9] 配置防火墙..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    log_info "防火墙配置完成"
else
    log_warn "未检测到 firewalld，请手动开放 80/443 端口"
fi

# 部署完成
echo ""
echo "========================================"
echo -e "${GREEN}✨ 部署完成！${NC}"
echo "========================================"
echo ""
echo "访问地址:"
echo "  http://semopic.com"
echo "  http://www.semopic.com"
echo ""
echo "服务状态检查:"
echo "  pm2 status              # 查看进程状态"
echo "  pm2 logs aivideo-backend # 查看后端日志"
echo "  systemctl status nginx  # 查看 Nginx 状态"
echo ""
echo "后续操作:"
echo "  1. 配置 SSL 证书 (HTTPS)"
echo "  2. 配置数据库迁移"
echo "  3. 设置自动备份"
echo ""
echo "========================================"
