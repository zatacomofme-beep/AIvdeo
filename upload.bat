@echo off
chcp 65001 >nul
:: SoraDirector GitHub 上传脚本 (Windows)
:: 使用方法: 双击运行或在命令行执行 upload.bat

echo ========================================
echo 🚀 SoraDirector - GitHub 上传工具
echo ========================================
echo.

:: 检查是否安装了 git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未安装 Git
    echo 请访问 https://git-scm.com/downloads 安装 Git
    pause
    exit /b 1
)

echo ✅ Git 已安装
echo.

:: 获取 GitHub 用户名和仓库名
set /p github_username="请输入 GitHub 用户名: "
set /p repo_name="请输入仓库名称 (如 AIvideo): "

echo.
echo 正在初始化 Git 仓库...

:: 初始化仓库（如果还没初始化）
if not exist .git (
    git init
    echo ✅ Git 仓库已初始化
) else (
    echo ✅ Git 仓库已存在
)

echo.
echo 正在添加文件到暂存区...
git add .

echo.
echo 正在提交文件...
git commit -m "🎉 Initial commit: SoraDirector AI视频导演系统" -m "✨ Features:" -m "- 黑色赛博朋克风格UI" -m "- 三步骤视频创作流程" -m "- 完整的后端API集成" -m "- Credits积分系统" -m "- GPT-4o Vision + Sora集成" -m "- TOS图片存储集成" -m "" -m "🔌 API Integration:" -m "- 图片上传到TOS" -m "- AI脚本生成" -m "- 视频生成与轮询" -m "- 用户积分管理" -m "" -m "📦 Tech Stack:" -m "- React 18 + TypeScript" -m "- Tailwind CSS v4" -m "- Zustand状态管理" -m "- FastAPI后端集成"

echo ✅ 文件已提交

echo.
echo 正在连接远程仓库...

:: 检查是否已经有远程仓库
git remote | find "origin" >nul
if %errorlevel% equ 0 (
    echo ⚠️  远程仓库 'origin' 已存在，正在移除...
    git remote remove origin
)

:: 添加远程仓库
git remote add origin "https://github.com/%github_username%/%repo_name%.git"
echo ✅ 远程仓库已连接: https://github.com/%github_username%/%repo_name%.git

echo.
echo 正在推送到 GitHub...
echo.
echo ⚠️  注意：如果提示输入密码，请使用 Personal Access Token，而不是 GitHub 密码
echo 如何获取 Token: GitHub → Settings → Developer settings → Personal access tokens
echo.

:: 尝试推送到 main 分支
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 🎉 成功上传到 GitHub！
    echo ========================================
    echo.
    echo 📦 仓库地址: https://github.com/%github_username%/%repo_name%
    echo.
    echo 🌟 后续更新代码使用：
    echo    git add .
    echo    git commit -m "你的提交信息"
    echo    git push
) else (
    echo.
    echo ========================================
    echo ❌ 上传失败
    echo ========================================
    echo.
    echo 可能的原因：
    echo 1. 仓库不存在，请先在 GitHub 上创建仓库: https://github.com/new
    echo 2. 认证失败，请确认使用的是 Personal Access Token
    echo 3. 网络连接问题
    echo.
    echo 查看详细指南: type GITHUB_UPLOAD_GUIDE.md
)

echo.
pause
