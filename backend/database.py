"""
数据库配置和连接管理模块
使用 SQLAlchemy ORM 连接 PostgreSQL 数据库
"""

import os
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Text, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 从环境变量读取数据库配置
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "AIvdeo")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# 构建数据库连接字符串
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"[DATABASE] 正在连接到数据库...")
print(f"[DATABASE] Host: {DB_HOST}:{DB_PORT}")
print(f"[DATABASE] Database: {DB_NAME}")
print(f"[DATABASE] User: {DB_USER}")

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    pool_size=int(os.getenv("DB_POOL_SIZE", 5)),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", 10)),
    pool_pre_ping=True,  # 启用连接池预检测
    echo=False  # 设置为 True 可以看到所有 SQL 语句
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()


# ======================
# 数据库表模型定义
# ======================

class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    username = Column(String(50), nullable=False)
    password_hash = Column(String(255))  # 密码哈希
    wechat_openid = Column(String(100), unique=True, index=True)  # 微信登录
    
    credits = Column(Integer, default=520)  # 用户积分
    role = Column(String(20), default='user')  # user 或 admin
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    is_active = Column(Boolean, default=True)  # 账户是否激活


class Product(Base):
    """商品表"""
    __tablename__ = "products"
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    name = Column(String(200), nullable=False)
    category = Column(String(100))
    usage = Column(String(200))  # 使用方式
    selling_points = Column(Text)  # 卖点
    
    # 商品图片（存储JSON数组）
    image_urls = Column(JSON)  # ["url1", "url2", ...]
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Project(Base):
    """项目表 - 保存一次创作的所有上下文"""
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False, index=True)
    product_id = Column(String(36), index=True)  # 关联的商品ID
    
    # 项目基本信息
    project_name = Column(String(200))
    status = Column(String(20), default='draft')  # draft, processing, completed, failed
    
    # 视觉锚点
    visual_img_url = Column(Text)
    product_type = Column(String(50))  # spray, bottle 等
    scale_constraint = Column(String(50))  # miniature 等
    
    # 角色设定
    character_id = Column(String(36))  # 关联的角色ID
    character_prompt = Column(Text)
    
    # 脚本设定（存储JSON）
    script_json = Column(JSON)  # [{time: '0-5s', audio: '...', action: '...'}, ...]
    
    # 视频配置
    video_config = Column(JSON)  # 存储视频配置信息
    
    # 结果
    final_sora_prompt = Column(Text)  # 最终的Sora提示词
    sora_video_url = Column(Text)  # 生成的视频URL
    sora_task_id = Column(String(100))  # Sora任务ID
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)


class Video(Base):
    """视频表 - 用户生成的所有视频"""
    __tablename__ = "videos"
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False, index=True)
    project_id = Column(String(36), index=True)  # 关联的项目ID
    
    # 视频基本信息
    video_url = Column(Text)
    thumbnail_url = Column(Text)
    
    # 生成参数
    prompt = Column(Text)  # 生成提示词
    script = Column(Text)  # 脚本内容
    product_name = Column(String(200))
    
    # 任务信息
    task_id = Column(String(100), index=True)  # Sora任务ID
    status = Column(String(20), default='processing')  # processing, completed, failed
    progress = Column(Integer, default=0)  # 0-100
    error = Column(Text)  # 错误信息
    
    # 视频配置
    orientation = Column(String(20))  # portrait, landscape
    resolution = Column(String(20))  # 720p, 1080p
    duration = Column(Integer)  # 视频时长（秒）
    
    # 公开设置
    is_public = Column(Boolean, default=False)  # 是否在广场公开
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)


class Character(Base):
    """角色表 - 用户创建的角色"""
    __tablename__ = "characters"
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    # 角色基本信息
    name = Column(String(100), nullable=False)
    description = Column(Text)
    avatar = Column(Text)  # 头像URL
    
    # 角色属性
    age = Column(Integer)
    gender = Column(String(20))
    style = Column(String(100))
    tags = Column(JSON)  # ["标签1", "标签2"]
    
    # Sora角色ID
    character_id = Column(String(100))  # Sora2角色系统的ID
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SavedPrompt(Base):
    """保存的提示词表"""
    __tablename__ = "saved_prompts"
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    content = Column(Text, nullable=False)
    product_name = Column(String(200))
    
    created_at = Column(DateTime, default=datetime.utcnow)


class CreditHistory(Base):
    """积分历史记录表"""
    __tablename__ = "credit_history"
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    action = Column(String(100), nullable=False)  # 操作类型
    amount = Column(Integer, nullable=False)  # 变动金额（正数为增加，负数为扣除）
    balance_after = Column(Integer, nullable=False)  # 操作后余额
    
    description = Column(Text)  # 描述
    related_id = Column(String(36))  # 关联的ID（如视频ID、充值ID等）
    
    created_at = Column(DateTime, default=datetime.utcnow)


# ======================
# 数据库工具函数
# ======================

def get_db():
    """获取数据库会话（用于依赖注入）"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
    """初始化数据库（创建所有表）"""
    print("[DATABASE] 正在创建数据库表...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[DATABASE] ✓ 数据库表创建成功！")
        print("[DATABASE] 已创建以下表：")
        print("  - users (用户表)")
        print("  - products (商品表)")
        print("  - projects (项目表)")
        print("  - videos (视频表)")
        print("  - characters (角色表)")
        print("  - saved_prompts (提示词表)")
        print("  - credit_history (积分历史表)")
        return True
    except Exception as e:
        print(f"[DATABASE] ✗ 创建数据库表失败: {e}")
        return False


def test_connection():
    """测试数据库连接"""
    print("[DATABASE] 正在测试数据库连接...")
    try:
        # 尝试执行简单查询
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        print("[DATABASE] [OK] 数据库连接成功！")
        return True
    except Exception as e:
        print(f"[DATABASE] [ERROR] 数据库连接失败: {e}")
        return False


if __name__ == "__main__":
    # 直接运行此文件时，测试连接并初始化数据库
    print("="*60)
    print("AIvdeo 数据库初始化工具")
    print("="*60)
    
    if test_connection():
        init_database()
        print("\n数据库初始化完成！")
    else:
        print("\n数据库连接失败，请检查配置！")
