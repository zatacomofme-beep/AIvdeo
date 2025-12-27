# 视频持久化方案 - Windows PowerShell 部署指南

## 📦 步骤1: 上传文件到服务器

Write-Host "=== 上传 database.py ===" -ForegroundColor Cyan
scp C:\Users\Administrator\Desktop\AIvdeo\backend\database.py root@115.190.137.87:/root/backend/

Write-Host "`n=== 上传 main.py ===" -ForegroundColor Cyan
scp C:\Users\Administrator\Desktop\AIvdeo\backend\main.py root@115.190.137.87:/root/backend/

Write-Host "`n✅ 文件上传完成!" -ForegroundColor Green

## 📝 步骤2: SSH连接服务器

Write-Host "`n=== 请执行以下命令连接服务器 ===" -ForegroundColor Yellow
Write-Host "ssh root@115.190.137.87" -ForegroundColor White

## 🔧 步骤3: 在服务器上执行的命令

@"

连接成功后,在服务器上依次执行:

# 1. 进入后端目录
cd /root/backend

# 2. 执行数据库迁移
python3 << 'EOF'
from database import engine
from sqlalchemy import text

print("开始数据库迁移...")

with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE videos ADD COLUMN url_expires_at TIMESTAMP'))
        print("✅ 添加字段 url_expires_at")
    except Exception as e:
        print(f"⚠️ url_expires_at 可能已存在: {e}")
    
    try:
        conn.execute(text('ALTER TABLE videos ADD COLUMN last_url_check TIMESTAMP'))
        print("✅ 添加字段 last_url_check")
    except Exception as e:
        print(f"⚠️ last_url_check 可能已存在: {e}")
    
    try:
        result = conn.execute(text('''
            UPDATE videos 
            SET url_expires_at = created_at + INTERVAL '3 days',
                last_url_check = CURRENT_TIMESTAMP
            WHERE status = 'completed' AND url_expires_at IS NULL
        '''))
        print(f"✅ 更新了 {result.rowcount} 个视频的过期时间")
    except Exception as e:
        print(f"⚠️ 更新失败: {e}")
    
    conn.commit()

print("迁移完成!")
EOF

# 3. 重启后端服务
pkill -f 'python.*main.py'
sleep 2
nohup python3 main.py > logs/backend.log 2>&1 &

# 4. 查看日志
tail -f logs/backend.log

"@ | Write-Host -ForegroundColor White
