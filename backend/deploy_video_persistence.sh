#!/bin/bash
# 视频持久化方案部署脚本

echo "=========================================="
echo "🚀 开始部署视频持久化方案"
echo "=========================================="

# 1. 进入后端目录
cd /root/backend || exit 1

# 2. 备份数据库（可选但推荐）
echo "📦 备份数据库..."
pg_dump -U postgres AIvdeo > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. 执行数据库迁移
echo "🔧 执行数据库迁移..."
python3 << 'PYTHON_SCRIPT'
from database import engine
from sqlalchemy import text

print("开始数据库迁移...")

with engine.connect() as conn:
    try:
        # 添加 url_expires_at 字段
        conn.execute(text('ALTER TABLE videos ADD COLUMN url_expires_at TIMESTAMP'))
        print("✅ 添加字段 url_expires_at")
    except Exception as e:
        print(f"⚠️ url_expires_at 字段可能已存在: {e}")
    
    try:
        # 添加 last_url_check 字段
        conn.execute(text('ALTER TABLE videos ADD COLUMN last_url_check TIMESTAMP'))
        print("✅ 添加字段 last_url_check")
    except Exception as e:
        print(f"⚠️ last_url_check 字段可能已存在: {e}")
    
    try:
        # 为已存在的completed视频设置过期时间
        result = conn.execute(text("""
            UPDATE videos 
            SET url_expires_at = created_at + INTERVAL '3 days',
                last_url_check = CURRENT_TIMESTAMP
            WHERE status = 'completed' AND url_expires_at IS NULL
        """))
        print(f"✅ 更新了 {result.rowcount} 个已存在视频的过期时间")
    except Exception as e:
        print(f"⚠️ 更新过期时间失败: {e}")
    
    try:
        # 检查并标记已过期的视频
        result = conn.execute(text("""
            UPDATE videos 
            SET status = 'url_expired',
                error = 'URL已失效（云雾URL有效期为3天）'
            WHERE status = 'completed' 
              AND url_expires_at < CURRENT_TIMESTAMP
        """))
        print(f"✅ 标记了 {result.rowcount} 个过期视频")
    except Exception as e:
        print(f"⚠️ 标记过期视频失败: {e}")
    
    conn.commit()

print("数据库迁移完成!")
PYTHON_SCRIPT

# 4. 重启后端服务
echo "🔄 重启后端服务..."
pkill -f 'python.*main.py'
sleep 2
nohup python3 main.py > logs/backend.log 2>&1 &

echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "📊 验证部署:"
echo "tail -f logs/backend.log"
echo ""
echo "🧪 测试API:"
echo "curl http://localhost:8000/api/videos/your-user-id"
echo ""
