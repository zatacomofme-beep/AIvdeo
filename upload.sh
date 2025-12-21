#!/bin/bash

# SoraDirector GitHub 上传脚本
# 使用方法: ./upload.sh

echo "🚀 SoraDirector - GitHub 上传工具"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否安装了 git
if ! command -v git &> /dev/null
then
    echo -e "${RED}❌ 错误: 未安装 Git${NC}"
    echo "请访问 https://git-scm.com/downloads 安装 Git"
    exit 1
fi

echo -e "${GREEN}✅ Git 已安装${NC}"
echo ""

# 获取 GitHub 用户名和仓库名
echo "请输入你的 GitHub 信息："
echo ""
read -p "GitHub 用户名: " github_username
read -p "仓库名称 (如 AIvideo): " repo_name

echo ""
echo -e "${YELLOW}正在初始化 Git 仓库...${NC}"

# 初始化仓库（如果还没初始化）
if [ ! -d .git ]; then
    git init
    echo -e "${GREEN}✅ Git 仓库已初始化${NC}"
else
    echo -e "${GREEN}✅ Git 仓库已存在${NC}"
fi

echo ""
echo -e "${YELLOW}正在添加文件到暂存区...${NC}"
git add .

echo ""
echo -e "${YELLOW}正在提交文件...${NC}"
git commit -m "🎉 Initial commit: SoraDirector AI视频导演系统

✨ Features:
- 黑色赛博朋克风格UI
- 三步骤视频创作流程
- 完整的后端API集成
- Credits积分系统
- GPT-4o Vision + Sora集成
- TOS图片存储集成

🔌 API Integration:
- 图片上传到TOS
- AI脚本生成
- 视频生成与轮询
- 用户积分管理

📦 Tech Stack:
- React 18 + TypeScript
- Tailwind CSS v4
- Zustand状态管理
- FastAPI后端集成"

echo -e "${GREEN}✅ 文件已提交${NC}"

echo ""
echo -e "${YELLOW}正在连接远程仓库...${NC}"

# 检查是否已经有远程仓库
if git remote | grep -q origin; then
    echo -e "${YELLOW}⚠️  远程仓库 'origin' 已存在，正在移除...${NC}"
    git remote remove origin
fi

# 添加远程仓库
git remote add origin "https://github.com/$github_username/$repo_name.git"
echo -e "${GREEN}✅ 远程仓库已连接: https://github.com/$github_username/$repo_name.git${NC}"

echo ""
echo -e "${YELLOW}正在推送到 GitHub...${NC}"
echo ""
echo -e "${YELLOW}⚠️  注意：如果提示输入密码，请使用 Personal Access Token，而不是 GitHub 密码${NC}"
echo -e "${YELLOW}如何获取 Token: GitHub → Settings → Developer settings → Personal access tokens${NC}"
echo ""

# 尝试推送到 main 分支
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=================================="
    echo -e "🎉 成功上传到 GitHub！"
    echo -e "==================================${NC}"
    echo ""
    echo -e "📦 仓库地址: ${GREEN}https://github.com/$github_username/$repo_name${NC}"
    echo ""
    echo -e "🌟 后续更新代码使用："
    echo -e "   ${YELLOW}git add .${NC}"
    echo -e "   ${YELLOW}git commit -m \"你的提交信息\"${NC}"
    echo -e "   ${YELLOW}git push${NC}"
else
    echo ""
    echo -e "${RED}=================================="
    echo -e "❌ 上传失败"
    echo -e "==================================${NC}"
    echo ""
    echo "可能的原因："
    echo "1. 仓库不存在，请先在 GitHub 上创建仓库: https://github.com/new"
    echo "2. 认证失败，请确认使用的是 Personal Access Token"
    echo "3. 网络连接问题"
    echo ""
    echo "查看详细指南: cat GITHUB_UPLOAD_GUIDE.md"
fi
