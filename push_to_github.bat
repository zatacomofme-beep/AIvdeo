@echo off
echo ================================================
echo 推送代码到GitHub
echo ================================================
echo.

cd /d C:\Users\Administrator\Desktop\AIvdeo

:retry
echo [%date% %time%] 尝试推送到GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo ✅ 推送成功！
    echo ================================================
    pause
    exit /b 0
) else (
    echo.
    echo ❌ 推送失败，10秒后重试...
    timeout /t 10 /nobreak
    goto retry
)
