# 📁 部署路径确认文档

## ✅ 服务器路径结构

```
/root/
├── backend/                    # 您现有的后端代码（已存在）
│   ├── .env                   # 环境配置（保留不变）
│   ├── requirements.txt       # Python依赖
│   ├── app/                   # 后端应用代码
│   │   └── main.py           # FastAPI入口
│   └── venv/                  # Python虚拟环境（部署时创建）
│
├── src/                       # 前端源码（上传后）
│   ├── components/
│   ├── pages/
│   └── ...
│
├── package.json               # 前端配置（上传后）
├── vite.config.ts            # Vite配置（上传后）
├── tailwind.config.js        # Tailwind配置（上传后）
├── index.html                # HTML入口（上传后）
│
├── dist/                      # 前端构建产物（npm run build后生成）
│   ├── index.html
│   ├── assets/
│   └── ...
│
└── deploy_server.sh          # 服务器部署脚本（需上传）
```

---

## 🔍 关键路径说明

### 1. 后端路径
- **代码位置**: `/root/backend/`
- **配置文件**: `/root/backend/.env` ✅ **保留现有配置，不会覆盖**
- **虚拟环境**: `/root/backend/venv/` (部署时自动创建)
- **启动命令**: `pm2 start venv/bin/uvicorn --name aivideo-backend -- app.main:app --host 0.0.0.0 --port 8000`
- **API端口**: `8000`

### 2. 前端路径
- **源码位置**: `/root/src/`, `/root/package.json` 等
- **构建输出**: `/root/dist/` (执行 `npm run build` 后生成)
- **Nginx配置**: `root /root/dist;`

### 3. Nginx配置
- **配置文件**: `/etc/nginx/conf.d/semopic.conf`
- **静态文件**: `/root/dist/` ← 前端构建产物
- **API代理**: `http://127.0.0.1:8000` ← 后端服务

---

## 🛡️ 安全保证

### ✅ 您的后端代码绝对安全
1. **不会删除**: 部署脚本只更新代码，不删除现有文件
2. **配置保留**: `/root/backend/.env` 会自动备份并恢复
3. **虚拟环境**: 不会影响现有的 `venv/` 目录

### ✅ 部署流程
```bash
1. 备份现有 .env → /tmp/backend.env.backup
2. 解压新代码到临时目录 → /tmp/aivideo_temp/
3. 同步前端代码 → /root/ (排除 backend/)
4. 更新后端代码 → /root/backend/ (排除 .env 和 venv/)
5. 恢复原有 .env → /root/backend/.env
6. 清理临时文件
```

---

## 📋 部署检查清单

### 部署前
- [x] 后端代码已存在于 `/root/backend/`
- [x] 后端 `.env` 已配置（数据库、TOS等）
- [ ] 本地已执行 `deploy_to_volcengine.ps1` 上传前端代码
- [ ] 已上传 `deploy_server.sh` 到服务器

### 部署后
- [ ] 后端服务运行正常: `pm2 status` 显示 `aivideo-backend` 为 `online`
- [ ] Nginx运行正常: `systemctl status nginx` 为 `active`
- [ ] 前端可访问: `http://semopic.com`
- [ ] API可用: `http://semopic.com/api/health`

---

## 🚀 执行命令

### 1️⃣ 本地上传代码
```powershell
cd C:\Users\Administrator\Desktop\AIvdeo
.\deploy_to_volcengine.ps1
```

### 2️⃣ 上传部署脚本
```powershell
scp C:\Users\Administrator\Desktop\AIvdeo\deploy_server.sh root@115.190.137.87:/root/
```

### 3️⃣ 登录服务器部署
```bash
ssh root@115.190.137.87
chmod +x /root/deploy_server.sh
bash /root/deploy_server.sh
```

---

## ⚙️ 环境变量示例

`/root/backend/.env` 应包含：

```env
# 数据库
DATABASE_URL=postgresql://用户名:密码@192.168.19.67:5432/aivideo

# 火山云TOS
TOS_ACCESS_KEY=AKLT***
TOS_SECRET_KEY=***
TOS_BUCKET=aivideo-assets
TOS_ENDPOINT=tos-cn-beijing.volces.com
TOS_REGION=cn-beijing

# API密钥
OPENAI_API_KEY=sk-***
SORA2_API_KEY=***
SORA2_API_URL=https://api.sora2.com

# 服务配置
SECRET_KEY=随机生成的密钥
HOST=0.0.0.0
PORT=8000
```

---

## ✅ 确认完成

- ✅ **后端路径**: `/root/backend/` (现有代码，不会被覆盖)
- ✅ **前端路径**: `/root/` (前端文件) + `/root/dist/` (构建产物)
- ✅ **配置安全**: `.env` 文件会自动备份和恢复
- ✅ **Nginx配置**: 指向 `/root/dist/`
- ✅ **API端口**: 8000
- ✅ **域名**: semopic.com / www.semopic.com

所有路径已确认正确！可以放心执行部署！🎉
