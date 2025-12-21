@echo off
chcp 65001
echo ================================================================
echo AIvdeo 上传到 GitHub 快速脚本
echo ================================================================
echo.

REM 检查是否已经初始化 Git
if not exist ".git" (
    echo [1/5] 初始化 Git 仓库...
    git init
    echo.
) else (
    echo [1/5] Git 仓库已存在，跳过初始化
    echo.
)

REM 配置用户信息（如果需要）
echo [2/5] 配置 Git 用户信息...
set /p username="请输入您的 GitHub 用户名: "
set /p email="请输入您的邮箱: "
git config user.name "%username%"
git config user.email "%email%"
echo.

REM 添加文件
echo [3/5] 添加文件到暂存区...
git add .
echo.

REM 查看状态
echo 当前状态：
git status --short
echo.

REM 提交
echo [4/5] 提交到本地仓库...
set /p commit_msg="请输入提交信息（默认：Initial commit）: "
if "%commit_msg%"=="" set commit_msg=Initial commit: AIvdeo AI视频创作平台
git commit -m "%commit_msg%"
echo.

REM 关联远程仓库
echo [5/5] 关联并推送到 GitHub...
set /p repo_url="请输入 GitHub 仓库地址（如：https://github.com/username/AIvdeo.git）: "

git remote add origin %repo_url% 2>nul
if errorlevel 1 (
    echo 远程仓库已存在，更新 URL...
    git remote set-url origin %repo_url%
)

REM 设置默认分支为 main
git branch -M main

REM 推送
echo.
echo 正在推送到 GitHub...
git push -u origin main

echo.
echo ================================================================
echo ✅ 完成！
echo ================================================================
echo.
echo 您的代码已上传到：%repo_url%
echo.
pause
