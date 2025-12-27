@echo off
echo ========================================
echo 前端构建并部署到服务器
echo ========================================

cd /d C:\Users\Administrator\Desktop\AIvdeo

echo.
echo [1/3] 构建前端...
call npm run build

if errorlevel 1 (
    echo 前端构建失败！
    pause
    exit /b 1
)

echo.
echo [2/3] 上传 dist 到服务器...
scp -r dist\* root@115.190.137.87:/root/frontend/

echo.
echo [3/3] 部署完成！
echo.
echo 前端访问地址: https://semopic.com
echo 或: https://www.semopic.com
echo.
pause
