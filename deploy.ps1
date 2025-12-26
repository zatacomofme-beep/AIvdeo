# 自动化部署脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始部署 AIvdeo 项目" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 服务器信息
$SERVER = "root@115.190.137.87"
$PASSWORD = "993124078King."

# 1. 上传前端文件
Write-Host "`n[1/4] 上传前端 index.html..." -ForegroundColor Yellow
scp C:\Users\Administrator\Desktop\AIvdeo\dist\index.html ${SERVER}:/root/dist/

Write-Host "`n[2/4] 上传前端 assets 文件..." -ForegroundColor Yellow
scp C:\Users\Administrator\Desktop\AIvdeo\dist\assets\* ${SERVER}:/root/dist/assets/

# 2. 上传后端文件
Write-Host "`n[3/4] 上传后端 main.py..." -ForegroundColor Yellow
scp C:\Users\Administrator\Desktop\AIvdeo\backend\main.py ${SERVER}:/root/backend/

# 3. 重启服务
Write-Host "`n[4/4] 重启后端服务..." -ForegroundColor Yellow
ssh ${SERVER} "pm2 restart aivideo"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n修复内容：" -ForegroundColor Cyan
Write-Host "  ✅ 修复轮询无法停止的问题" -ForegroundColor White
Write-Host "  ✅ 修复积分计算错误（10元=1000积分）" -ForegroundColor White
Write-Host "  ✅ loadUserData 现在会重新加载积分" -ForegroundColor White
Write-Host "`n测试步骤：" -ForegroundColor Cyan
Write-Host "  1. 清除浏览器缓存（localStorage.clear()）" -ForegroundColor White
Write-Host "  2. 重新登录" -ForegroundColor White
Write-Host "  3. 进行充值测试" -ForegroundColor White
