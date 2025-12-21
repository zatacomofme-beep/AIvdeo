# 🎬 SoraDirector - AI 视频导演系统

专为电商产品生成UGC风格推广视频的AI应用，使用React + FastAPI技术栈。

## ✨ 特点

- 🎨 **黑色赛博朋克风格** - 专业的暗色主题 + 黄色强调色
- 🚀 **现代化技术栈** - React + Tailwind CSS + TypeScript
- 🤖 **AI 智能创作** - GPT-4o Vision 分析 + Sora 视频生成
- 📝 **表单式工作流** - 三步骤完成视频创作
- 🔌 **完整后端集成** - 已集成所有 FastAPI 接口
- 💳 **Credits 积分系统** - 完整的用户积分管理

## 🏗️ 技术架构

### 前端技术栈
- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Tailwind CSS v4** - 样式系统
- **Zustand** - 状态管理
- **Lucide React** - 图标库

### 后端集成
- **FastAPI** - Python后端框架
- **GPT-4o Vision** - 产品图片分析
- **Sora API** - 视频生成
- **TOS 存储** - 图片和视频存储

## 📋 核心功能

### 1️⃣ 步骤一：商品信息录入
- 上传产品图片（自动上传到TOS）
- 填写品名、类目、使用方式
- 输入核心卖点

### 2️⃣ 步骤二：视频配置
- 选择投放国家（中国、印尼、美国等）
- 设置视频语言（中文、英文、印尼语等）
- 配置视频方向（竖屏/横屏）
- 选择分辨率（720P/1080P）
- 设置时长（15秒/25秒）

### 3️⃣ 步骤三：脚本生成与视频创作
- 手动输入脚本 或 AI自动生成
- 设置视频生成数量（1-10个）
- 一键生成视频（自动扣除Credits）
- 实时查看生成进度

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，配置后端API地址
# VITE_API_BASE_URL=http://localhost:8000
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 启动后端服务（需要另开终端）
```bash
cd backend
python main.py  # 或 uvicorn main:app --reload
```

访问 http://localhost:5173 查看应用

## 🔌 API集成说明

### 已集成的API接口

| 接口 | 路径 | 说明 | 状态 |
|------|------|------|------|
| 上传图片 | `POST /api/upload-image` | 上传产品图片到TOS | ✅ 已集成 |
| 分析产品 | `POST /api/analyze-product` | GPT-4o Vision分析 | ✅ 已集成 |
| 生成脚本 | `POST /api/generate-script` | AI生成视频脚本 | ✅ 已集成 |
| 生成视频 | `POST /api/generate-video` | Sora生成视频 | ✅ 已集成 |
| 查询任务 | `GET /api/video-task/{id}` | 查询视频生成状态 | ✅ 已集成 |
| 获取积分 | `GET /api/user/credits` | 获取用户积分 | ✅ 已集成 |
| 扣除积分 | `POST /api/user/deduct-credits` | 扣除用户积分 | ✅ 已集成 |

详细的API文档请查看 [API_INTEGRATION.md](./API_INTEGRATION.md)

## 📁 项目结构

```
src/
├── app/
│   ├── components/
│   │   ├── TopBar.tsx           # 顶部导航栏
│   │   ├── Sidebar.tsx          # 左侧边栏
│   │   ├── MainWorkspace.tsx    # 主工作区（上传区域）
│   │   └── DirectorPanel.tsx    # AI导演弹窗（三步骤表单）
│   ├── lib/
│   │   ├── store.ts             # Zustand状态管理
│   │   ├── utils.ts             # 工具函数
│   │   ├── api.ts               # ✅ 后端API集成
│   │   ├── api-mock.ts          # Mock数据（测试用）
│   │   └── api-example.ts       # API示例参考
│   └── App.tsx                  # 主应用组件
└── styles/
    ├── index.css                # 样式入口
    ├── tailwind.css             # Tailwind配置
    └── theme.css                # 主题变量
```

## 🎯 使用流程

### 完整的视频创作流程

1. **上传产品图片**
   - 点击或拖拽图片到上传区域
   - 图片自动上传到TOS存储
   - 上传成功后自动打开AI导演弹窗

2. **步骤一：填写商品信息**
   - 输入品名（必填）
   - 选择类目（必填）
   - 填写使用方式（可选）
   - 输入核心卖点（可选）
   - 点击"保存并继续"

3. **步骤二：配置视频参数**
   - 选择投放国家（必填）
   - 选择视频语言（必填）
   - 选择视频方向（竖屏/横屏）
   - 选择分辨率（720P/1080P）
   - 选择时长（15秒/25秒）
   - 点击"下一步"

4. **步骤三：生成脚本和视频**
   - **方式A**: 点击"AI生成"按钮，自动生成脚本
   - **方式B**: 手动在文本框输入脚本
   - 设置生成数量（1-10个视频）
   - 点击"生成视频"按钮
   - 等待视频生成完成（自动轮询状态）
   - 生成成功后自动扣除Credits

## 💰 Credits 积分系统

- 每个用户初始 **520 Credits**
- 生成1个视频消耗 **50 Credits**
- 可以一次生成1-10个视频（消耗50-500 Credits）
- 顶部栏实时显示剩余积分

## 🔧 开发说明

### 环境变量配置

创建 `.env` 文件：

```env
# 后端API地址
VITE_API_BASE_URL=http://localhost:8000

# 如果后端部署在其他地址：
# VITE_API_BASE_URL=https://api.soradirector.com
```

### API接口调用逻辑

所有API调用都在 `/src/app/lib/api.ts` 中定义：

```typescript
import { api } from '../lib/api';

// 上传图片
const tosUrl = await api.uploadImage(file);

// 生成脚本
const script = await api.generateScript({
  productName: "智能手表",
  category: "electronics",
  // ...其他参数
});

// 生成视频
const result = await api.generateVideo({
  script: "脚本内容...",
  productImages: [tosUrl],
  // ...其他参数
});

// 查询视频状态
const status = await api.queryVideoTask(taskId);
```

### 错误处理

所有API调用都包含完整的错误处理：

- **网络错误**: 显示友好的错误提示
- **上传失败**: 降级使用本地base64（不阻断流程）
- **生成失败**: 允许用户重试或切换到手动模式
- **轮询超时**: 自动停止轮询，提示用户

## 📱 响应式设计

- ✅ 桌面端优化（1920x1080）
- ✅ 笔记本适配（1366x768）
- ✅ 平板适配（768px+）
- ⚠️ 移动端部分功能受限（建议使用桌面端）

## 🎨 设计风格

### 颜色方案
- **主色调**: 黑色 (#000000)
- **背景色**: 深灰 (#111111, #1a1a1a)
- **强调色**: 黄色 (#fbbf24, #f59e0b)
- **文字色**: 白色/灰色系

### UI组件
- **圆角**: 8px-12px
- **边框**: 1-2px，深灰色
- **阴影**: 柔和的黑色阴影
- **过渡**: 所有交互都有平滑动画

## 📊 状态管理

使用 Zustand 进行全局状态管理：

```
// 主要状态
- uploadedImage: 上传的图片URL
- currentStep: 当前步骤 (1/2/3)
- isGenerating: 是否正在生成视频
- credits: 用户剩余积分
- script: 视频脚本内容
- videoConfig: 视频配置参数
- savedProducts: 保存的商品列表
```

## 🐛 调试与日志

### 浏览器控制台日志

打开浏览器开发者工具，查看：

```javascript
// Network标签 - 查看API请求
- POST /api/upload-image
- POST /api/generate-script
- POST /api/generate-video
- GET /api/video-task/{taskId}

// Console标签 - 查看日志
console.log('图片已上传到TOS:', tosUrl);
console.log('脚本生成成功:', result);
console.error('视频生成失败:', error);
```

### 常见问题排查

**问题**: 图片上传失败
- 检查后端服务是否运行
- 检查TOS配置是否正确
- 查看浏览器Console的错误信息

**问题**: 脚本生成失败
- 确认所有必填字段已填写
- 检查后端GPT-4o API配置
- 可以切换到手动输入模式

**问题**: 视频一直在生成中
- 检查后端Sora API是否正常
- 查看视频任务轮询日志
- 确认task_id是否正确

## 📚 相关文档

- [API集成完整文档](./API_INTEGRATION.md) - 详细的API接口说明
- [实施指南](./IMPLEMENTATION_GUIDE.md) - 项目实施步骤
- [演示指南](./DEMO_GUIDE.md) - 功能演示说明

## 🚧 待开发功能

- [ ] 用户登录/注册系统
- [ ] Credits充值功能
- [ ] 视频历史记录
- [ ] 视频预览和下载
- [ ] 批量生成管理
- [ ] 模板库功能
- [ ] 多语言支持

## 📄 开源协议

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**技术栈**: React 18 + TypeScript + Tailwind CSS v4 + Zustand + FastAPI
**最后更新**: 2024年12月

# AIvdeo - AI 视频创作平台

基于 AI 的智能视频创作平台，支持商品视频生成、角色创作、脚本编写等功能。

## ✨ 功能特性

- 🎬 **AI 视频生成** - 基于 Sora 2 模型的视频生成
- 🎭 **角色创作** - 自定义 AI 角色
- 📝 **智能脚本** - AI 辅助脚本生成
- 🛍️ **商品管理** - 商品信息管理和展示
- 💾 **数据持久化** - PostgreSQL 数据库存储
- 🔐 **用户系统** - 用户注册、登录、积分管理

## 🛠️ 技术栈

### 前端
- React 18
- TypeScript
- Vite
- TailwindCSS
- Zustand (状态管理)
- Lucide React (图标)

### 后端
- Python 3.8+
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL
- OpenAI API
- 火山云 TOS (对象存储)

## 📦 项目结构

```
AIvdeo/
├── src/                    # 前端源码
│   ├── app/
│   │   ├── components/    # React 组件
│   │   ├── lib/          # 工具库
│   │   └── assets/       # 静态资源
│   └── main.tsx          # 入口文件
├── backend/               # 后端源码
│   ├── main.py           # FastAPI 主文件
│   ├── database.py       # 数据库模型
│   ├── prompts.py        # AI 提示词
│   └── requirements.txt  # Python 依赖
└── public/               # 公共资源
```

## 🚀 快速开始

### 前端部署

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

### 后端部署

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填写配置

# 初始化数据库
python3 init_db.py

# 启动服务
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🗄️ 数据库配置

项目使用 PostgreSQL 数据库，包含以下表：

- `users` - 用户表
- `products` - 商品表
- `projects` - 项目表
- `videos` - 视频表
- `characters` - 角色表
- `saved_prompts` - 提示词表
- `credit_history` - 积分历史表

详细配置请参考 `backend/DATABASE_SETUP.md`

## 🔑 环境变量配置

### 后端 `.env` 配置

``env
# 数据库配置
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=AIvdeo
DB_USER=your_username
DB_PASSWORD=your_password

# TOS 对象存储
TOS_ACCESS_KEY=your_access_key
TOS_SECRET_KEY=your_secret_key
TOS_BUCKET=your_bucket
TOS_REGION=cn-beijing

# AI 服务
LLM_API_KEY=your_llm_api_key
VIDEO_GENERATION_API_KEY=your_video_api_key
CHARACTER_VIDEO_API_KEY=your_character_api_key
```

## 📝 开发指南

### 前端开发

1. 组件位于 `src/app/components/`
2. 状态管理使用 Zustand，定义在 `src/app/lib/store.ts`
3. API 调用封装在 `src/app/lib/api.ts`

### 后端开发

1. API 路由定义在 `backend/main.py`
2. 数据库模型在 `backend/database.py`
3. AI 提示词在 `backend/prompts.py`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👥 作者

AIvdeo Team

---

**注意**：本项目仅供学习和研究使用。
