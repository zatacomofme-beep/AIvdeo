# AIvdeo 数据库 API 完整列表

## 📊 数据库表使用情况

所有 7 个数据库表已全部启用：

1. ✅ **users** - 用户表
2. ✅ **products** - 商品表
3. ✅ **projects** - 项目表
4. ✅ **videos** - 视频表
5. ✅ **characters** - 角色表
6. ✅ **saved_prompts** - 提示词表
7. ✅ **credit_history** - 积分历史表

---

## 🔐 1. 用户认证 API

### 用户注册
- **接口**: `POST /api/register`
- **功能**: 创建新用户账户
- **数据库表**: `users`
- **请求参数**:
  ```json
  {
    "email": "user@example.com",
    "username": "用户名",
    "password": "密码"
  }
  ```
- **返回**: 用户信息（初始积分 520）

### 用户登录
- **接口**: `POST /api/login`
- **功能**: 用户登录验证
- **数据库表**: `users`
- **请求参数**:
  ```json
  {
    "email": "user@example.com",
    "password": "密码"
  }
  ```
- **返回**: 用户信息（包含积分余额）

### 获取用户信息
- **接口**: `GET /api/user/{user_id}`
- **功能**: 获取用户详细信息
- **数据库表**: `users`
- **返回**: 用户信息、积分余额、创建时间等

---

## 🛍️ 2. 商品管理 API（新增）

### 创建商品
- **接口**: `POST /api/products`
- **功能**: 创建新商品
- **数据库表**: `products`
- **请求参数**:
  ```json
  {
    "user_id": "用户ID",
    "name": "商品名称",
    "description": "商品描述",
    "category": "商品分类",
    "price": 99.99,
    "images": ["图片URL1", "图片URL2"],
    "specs": {"size": "10cm", "weight": "50g"},
    "selling_points": ["卖点1", "卖点2"]
  }
  ```

### 获取用户的所有商品
- **接口**: `GET /api/products/{user_id}`
- **功能**: 获取用户创建的所有商品
- **数据库表**: `products`
- **返回**: 商品列表

### 获取单个商品详情
- **接口**: `GET /api/product/{product_id}`
- **功能**: 获取商品详细信息
- **数据库表**: `products`
- **返回**: 商品完整信息

### 更新商品信息
- **接口**: `PUT /api/product/{product_id}`
- **功能**: 更新商品信息
- **数据库表**: `products`
- **请求参数**: 任意字段（可选）
  ```json
  {
    "name": "新名称",
    "price": 199.99,
    "images": ["新图片URL"]
  }
  ```

### 删除商品
- **接口**: `DELETE /api/product/{product_id}`
- **功能**: 删除商品
- **数据库表**: `products`

---

## 📁 3. 项目管理 API

### 创建项目
- **接口**: `POST /api/projects`
- **功能**: 创建视频项目
- **数据库表**: `projects`
- **请求参数**:
  ```json
  {
    "user_id": "用户ID",
    "product_name": "产品名称",
    "product_description": "产品描述"
  }
  ```

### 获取用户的所有项目
- **接口**: `GET /api/projects/{user_id}`
- **功能**: 获取用户的所有项目
- **数据库表**: `projects`
- **返回**: 项目列表（按创建时间倒序）

---

## 🎬 4. 视频管理 API

### 保存视频
- **接口**: `POST /api/videos`
- **功能**: 保存生成的视频
- **数据库表**: `videos`
- **请求参数**:
  ```json
  {
    "user_id": "用户ID",
    "project_id": "项目ID（可选）",
    "video_url": "视频URL",
    "thumbnail_url": "缩略图URL",
    "script": {"镜头数据"},
    "product_name": "产品名称",
    "prompt": "生成提示词",
    "is_public": false
  }
  ```

### 获取用户的所有视频
- **接口**: `GET /api/videos/{user_id}`
- **功能**: 获取用户的所有视频
- **数据库表**: `videos`
- **返回**: 视频列表（按创建时间倒序）

### 删除视频
- **接口**: `DELETE /api/videos/{video_id}`
- **功能**: 删除用户的视频
- **数据库表**: `videos`

### 获取公开视频（内容广场）
- **接口**: `GET /api/public-videos`
- **功能**: 获取所有公开的视频
- **数据库表**: `videos`
- **查询条件**: `is_public = true`

---

## 🎭 5. 角色管理 API

### 创建角色
- **接口**: `POST /create-character`
- **功能**: 创建角色
- **数据库表**: `characters`
- **请求参数**:
  ```json
  {
    "name": "角色名称",
    "description": "角色描述",
    "age": 25,
    "gender": "female",
    "style": "professional",
    "tags": ["标签1", "标签2"]
  }
  ```

### 获取用户的所有角色
- **接口**: `GET /api/characters/{user_id}`
- **功能**: 获取用户创建的所有角色
- **数据库表**: `characters`
- **返回**: 角色列表（按创建时间倒序）

---

## 💡 6. 提示词管理 API

### 保存提示词
- **接口**: `POST /api/prompts`
- **功能**: 保存常用提示词
- **数据库表**: `saved_prompts`
- **请求参数**:
  ```json
  {
    "user_id": "用户ID",
    "content": "提示词内容",
    "product_name": "关联产品名称"
  }
  ```

### 获取用户的所有提示词
- **接口**: `GET /api/prompts/{user_id}`
- **功能**: 获取用户保存的所有提示词
- **数据库表**: `saved_prompts`
- **返回**: 提示词列表（按创建时间倒序）

### 删除提示词
- **接口**: `DELETE /api/prompts/{prompt_id}`
- **功能**: 删除提示词
- **数据库表**: `saved_prompts`

---

## 💰 7. 积分管理 API

### 消费积分
- **接口**: `POST /api/credits/consume`
- **功能**: 消费用户积分
- **数据库表**: `users`, `credit_history`
- **请求参数**:
  ```json
  {
    "user_id": "用户ID",
    "amount": 50,
    "action": "生成视频",
    "description": "消费说明"
  }
  ```
- **操作**:
  1. 检查用户积分是否足够
  2. 扣除用户积分
  3. 记录积分历史

### 获取积分历史
- **接口**: `GET /api/credits/history/{user_id}`
- **功能**: 获取用户的积分变动历史
- **数据库表**: `credit_history`
- **返回**: 积分历史记录（按时间倒序）

---

## 👨‍💼 8. 管理员 API

### 获取统计数据
- **接口**: `GET /api/admin/stats`
- **功能**: 获取平台统计数据
- **数据库表**: `users`, `videos`, `credit_history`
- **返回**:
  ```json
  {
    "totalUsers": 总用户数,
    "totalVideos": 总视频数,
    "publicVideos": 公开视频数,
    "totalCreditsUsed": 总消费积分
  }
  ```

### 获取所有用户
- **接口**: `GET /api/admin/users`
- **数据库表**: `users`

### 获取所有视频
- **接口**: `GET /api/admin/videos`
- **数据库表**: `videos`

### 获取所有提示词
- **接口**: `GET /api/admin/prompts`
- **数据库表**: `saved_prompts`

### 切换视频公开状态
- **接口**: `PUT /api/admin/video/{video_id}/public`
- **数据库表**: `videos`
- **参数**: `isPublic` (boolean)

### 删除视频（管理员）
- **接口**: `DELETE /api/admin/video/{video_id}`
- **数据库表**: `videos`

### 调整用户积分
- **接口**: `PUT /api/admin/user/{user_id}/credits`
- **数据库表**: `users`, `credit_history`
- **参数**: `credits` (新的积分值)
- **操作**: 记录积分变动历史

---

## 🚀 部署步骤

### 1. 安装依赖
```bash
pip install psycopg2-binary sqlalchemy alembic python-dotenv
```

### 2. 配置环境变量
确保 `.env` 文件包含数据库配置：
```env
DB_HOST=192.168.19.67
DB_PORT=5432
DB_NAME=AIvdeo
DB_USER=alizabos
DB_PASSWORD=993124078King
```

### 3. 上传文件
将以下文件上传到云服务器：
- `main.py` - 主程序（所有 API）
- `database.py` - 数据库模型
- `.env` - 环境配置

### 4. 重启服务
```bash
# 停止旧进程
pkill -9 -f "uvicorn main:app"

# 启动新服务
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
```

### 5. 验证数据库连接
查看启动日志：
```bash
tail -f server.log
```

应该看到：
```
[DATABASE] [OK] 数据库连接成功！
[DATABASE] 数据将保存到 PostgreSQL
```

---

## ✅ 数据库集成完成

现在所有用户数据都会持久化保存到 PostgreSQL 数据库中：

- ✅ 用户注册/登录数据
- ✅ 商品信息
- ✅ 项目数据
- ✅ 视频数据
- ✅ 角色数据
- ✅ 提示词数据
- ✅ 积分历史记录

不再使用内存存储，数据永久保存！🎉
