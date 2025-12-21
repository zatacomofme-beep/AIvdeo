# AIvdeo 数据库配置指南

## 📋 数据库信息

- **数据库类型**: PostgreSQL 12
- **数据库名称**: AIvdeo
- **主机地址**: postgres9ee68dc0154b.rds-pg.ivolces.com
- **端口**: 5432
- **用户名**: alizabos
- **私网地址**: 192.168.19.67

---

## 🚀 在云服务器上配置数据库

### 步骤 1: 上传文件到服务器

将以下新文件上传到服务器的 backend 目录：

```bash
backend/
  ├── .env              # ✨ 新增：环境配置文件
  ├── database.py       # ✨ 新增：数据库模型定义
  ├── init_db.py        # ✨ 新增：数据库初始化脚本
  └── requirements.txt  # ✅ 已更新：添加了数据库依赖
```

**上传方法（任选一种）：**

```bash
# 方法1: 使用 scp
scp .env database.py init_db.py requirements.txt root@你的服务器IP:/root/soradirector-backend/

# 方法2: 使用 SFTP 客户端（如 WinSCP、FileZilla）
# 直接拖拽文件到服务器目录
```

---

### 步骤 2: 安装数据库依赖

SSH 登录到服务器后执行：

```bash
cd /root/soradirector-backend

# 安装新的依赖包
pip3 install -r requirements.txt

# 或者单独安装数据库相关包
pip3 install psycopg2-binary==2.9.9 sqlalchemy==2.0.25 alembic==1.13.1
```

---

### 步骤 3: 验证 .env 配置

确认 `.env` 文件中的数据库配置正确：

```bash
# 查看 .env 文件
cat .env | grep DB_

# 应该看到：
# DB_HOST=postgres9ee68dc0154b.rds-pg.ivolces.com
# DB_PORT=5432
# DB_NAME=AIvdeo
# DB_USER=alizabos
# DB_PASSWORD=993124078King
```

⚠️ **重要提示**：
- 如果服务器在同一个VPC内网，建议修改 `DB_HOST` 为私网地址 `192.168.19.67` 以获得更好的性能
- 修改方法：`vi .env` 然后编辑 DB_HOST 的值

---

### 步骤 4: 初始化数据库

运行数据库初始化脚本：

```bash
# 测试数据库连接并创建表
python3 init_db.py
```

**预期输出：**

```
============================================================
AIvdeo 数据库初始化脚本
============================================================

步骤 1/3: 测试数据库连接...
[DATABASE] 正在连接到数据库...
[DATABASE] Host: postgres9ee68dc0154b.rds-pg.ivolces.com:5432
[DATABASE] Database: AIvdeo
[DATABASE] User: alizabos
[DATABASE] 正在测试数据库连接...
[DATABASE] ✓ 数据库连接成功！
✓ 数据库连接成功！

步骤 2/3: 检查现有表...
没有发现已存在的表

步骤 3/3: 创建数据库表...
[DATABASE] 正在创建数据库表...
[DATABASE] ✓ 数据库表创建成功！
[DATABASE] 已创建以下表：
  - users (用户表)
  - products (商品表)
  - projects (项目表)
  - videos (视频表)
  - characters (角色表)
  - saved_prompts (提示词表)
  - credit_history (积分历史表)

============================================================
🎉 数据库初始化成功！
============================================================
```

---

### 步骤 5: 验证表结构

登录 PostgreSQL 查看创建的表：

```bash
# 方法1: 使用 psql 命令行工具
PGPASSWORD=993124078King psql -h postgres9ee68dc0154b.rds-pg.ivolces.com -U alizabos -d AIvdeo -c "\dt"

# 方法2: 进入 psql 交互式界面
PGPASSWORD=993124078King psql -h postgres9ee68dc0154b.rds-pg.ivolces.com -U alizabos -d AIvdeo

# 然后在 psql 中执行：
\dt                    # 列出所有表
\d users              # 查看 users 表结构
\d videos             # 查看 videos 表结构
```

**应该看到 7 个表：**

```
             List of relations
 Schema |      Name       | Type  |  Owner   
--------+-----------------+-------+----------
 public | characters      | table | alizabos
 public | credit_history  | table | alizabos
 public | products        | table | alizabos
 public | projects        | table | alizabos
 public | saved_prompts   | table | alizabos
 public | users           | table | alizabos
 public | videos          | table | alizabos
```

---

### 步骤 6: 更新后端代码以使用数据库

后续需要修改 `main.py`，将内存数据库替换为真实数据库操作。这部分我们可以逐步进行：

1. 导入数据库模块
2. 替换用户管理逻辑
3. 替换视频管理逻辑
4. 替换商品管理逻辑

---

## 🔧 常见问题排查

### 问题 1: 连接超时

```
psycopg2.OperationalError: could not connect to server: Connection timed out
```

**解决方法：**
1. 检查服务器防火墙是否开放 5432 端口
2. 检查数据库服务器的安全组规则
3. 尝试使用私网地址 `192.168.19.67` 替代公网地址

### 问题 2: 认证失败

```
psycopg2.OperationalError: FATAL: password authentication failed
```

**解决方法：**
1. 确认 .env 文件中的用户名和密码正确
2. 确认数据库用户有足够的权限

### 问题 3: 数据库不存在

```
psycopg2.OperationalError: FATAL: database "AIvdeo" does not exist
```

**解决方法：**
1. 登录 PostgreSQL 创建数据库：
```bash
PGPASSWORD=993124078King psql -h postgres9ee68dc0154b.rds-pg.ivolces.com -U alizabos -d postgres -c "CREATE DATABASE AIvdeo;"
```

---

## 📊 数据库表结构说明

### 1. users (用户表)
- 存储用户账号信息、积分、角色
- 支持邮箱登录和微信登录

### 2. products (商品表)
- 存储用户创建的商品信息
- 包含商品图片、卖点等

### 3. projects (项目表)
- 保存一次完整的创作流程
- 包含角色、脚本、视频配置等

### 4. videos (视频表)
- 存储所有生成的视频
- 跟踪生成状态和进度

### 5. characters (角色表)
- 用户创建的AI角色
- 关联 Sora2 角色系统

### 6. saved_prompts (提示词表)
- 用户保存的提示词库

### 7. credit_history (积分历史表)
- 记录所有积分变动
- 用于账单和审计

---

## ✅ 下一步

数据库配置完成后，您需要：

1. ✅ **测试数据库连接** - 已通过 init_db.py 完成
2. ⏳ **更新 main.py** - 将内存操作替换为数据库操作
3. ⏳ **重启后端服务** - 使新配置生效
4. ⏳ **测试 API** - 确认所有功能正常

需要我继续帮您更新 main.py 以使用数据库吗？
