#!/bin/bash

# AIvdeo 数据库自动配置脚本
# 在云服务器上运行此脚本可自动完成数据库配置

echo "================================================================"
echo "AIvdeo 数据库自动配置脚本"
echo "================================================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "main.py" ]; then
    echo "❌ 错误: 请在 backend 目录下运行此脚本"
    echo "   cd /root/soradirector-backend"
    exit 1
fi

echo "步骤 1/4: 检查 Python 环境..."
echo "--------------------------------"
python3 --version
if [ $? -ne 0 ]; then
    echo "❌ Python3 未安装"
    exit 1
fi
echo "✓ Python3 已安装"
echo ""

echo "步骤 2/4: 安装数据库依赖..."
echo "--------------------------------"
pip3 install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✓ 依赖安装成功"
echo ""

echo "步骤 3/4: 检查 .env 配置文件..."
echo "--------------------------------"
if [ ! -f ".env" ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "   请先上传 .env 文件到当前目录"
    exit 1
fi

# 显示数据库配置（隐藏密码）
echo "数据库配置："
grep "DB_HOST" .env
grep "DB_PORT" .env
grep "DB_NAME" .env
grep "DB_USER" .env
echo "DB_PASSWORD=***（已隐藏）"
echo "✓ 配置文件已找到"
echo ""

echo "步骤 4/4: 初始化数据库..."
echo "--------------------------------"
python3 init_db.py
if [ $? -ne 0 ]; then
    echo "❌ 数据库初始化失败"
    exit 1
fi
echo ""

echo "================================================================"
echo "🎉 数据库配置完成！"
echo "================================================================"
echo ""
echo "下一步："
echo "  1. 重启后端服务："
echo "     ./start.sh"
echo ""
echo "  2. 或者使用 uvicorn："
echo "     uvicorn main:app --host 0.0.0.0 --port 8000"
echo ""
echo "================================================================"
