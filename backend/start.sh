#!/bin/bash

# SoraDirector 后端启动脚本

echo "正在启动 SoraDirector 后端服务..."

# 加载环境变量（如果使用 .env 文件）
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "已加载 .env 配置文件"
fi

# 检查必需的环境变量
if [ -z "$TOS_ACCESS_KEY" ] || [ -z "$TOS_SECRET_KEY" ]; then
    echo "错误: 请先配置 TOS_ACCESS_KEY 和 TOS_SECRET_KEY"
    echo "可以复制 .env.example 为 .env 并填写实际值"
    exit 1
fi

# 启动服务
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
