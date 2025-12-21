-- ================================================================
-- AIvdeo 数据库表结构创建脚本
-- 在火山云数据库控制台的 SQL 查询界面执行此脚本
-- ================================================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255),
    wechat_openid VARCHAR(100) UNIQUE,
    credits INTEGER DEFAULT 520,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wechat ON users(wechat_openid);

-- 2. 商品表
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    usage VARCHAR(200),
    selling_points TEXT,
    image_urls JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- 3. 项目表
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36),
    project_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'draft',
    visual_img_url TEXT,
    product_type VARCHAR(50),
    scale_constraint VARCHAR(50),
    character_id VARCHAR(36),
    character_prompt TEXT,
    script_json JSONB,
    video_config JSONB,
    final_sora_prompt TEXT,
    sora_video_url TEXT,
    sora_task_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_product_id ON projects(product_id);

-- 4. 视频表
CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36),
    video_url TEXT,
    thumbnail_url TEXT,
    prompt TEXT,
    script TEXT,
    product_name VARCHAR(200),
    task_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'processing',
    progress INTEGER DEFAULT 0,
    error TEXT,
    orientation VARCHAR(20),
    resolution VARCHAR(20),
    duration INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_project_id ON videos(project_id);
CREATE INDEX IF NOT EXISTS idx_videos_task_id ON videos(task_id);

-- 5. 角色表
CREATE TABLE IF NOT EXISTS characters (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar TEXT,
    age INTEGER,
    gender VARCHAR(20),
    style VARCHAR(100),
    tags JSONB,
    character_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);

-- 6. 保存的提示词表
CREATE TABLE IF NOT EXISTS saved_prompts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    product_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);

-- 7. 积分历史表
CREATE TABLE IF NOT EXISTS credit_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    related_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON credit_history(user_id);

-- ================================================================
-- 执行完成后，查看创建的表
-- ================================================================
-- 使用以下命令查看所有表：
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
