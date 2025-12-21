# API 集成说明

## ✅ 已完成的API集成

前端已经完全集成了后端API接口，所有功能都会调用真实的 FastAPI 后端。

### 📡 API 接口文件

**文件位置**: `/src/app/lib/api.ts`

这个文件包含所有后端API的调用逻辑：

1. **uploadImage** - 上传图片到TOS存储
2. **analyzeProduct** - GPT-4o Vision分析产品
3. **generateScript** - AI生成视频脚本
4. **generateVideo** - Sora生成视频
5. **queryVideoTask** - 查询视频任务状态
6. **getUserCredits** - 获取用户积分
7. **deductCredits** - 扣除用户积分

---

## 🔌 后端API地址配置

### 1. 创建环境变量文件

```bash
# 复制示例文件
cp .env.example .env
```

### 2. 配置后端地址

编辑 `.env` 文件：

```env
# 本地开发
VITE_API_BASE_URL=http://localhost:8000

# 或者生产环境
VITE_API_BASE_URL=https://api.your-domain.com
```

---

## 📋 API 端点说明

### 1. 上传图片
```
POST /api/upload-image
Content-Type: multipart/form-data

Request Body:
- image: File

Response:
{
  "url": "https://tos.example.com/xxx.jpg"
}
```

### 2. 分析产品
```
POST /api/analyze-product
Content-Type: application/json

Request Body:
{
  "image_url": "https://tos.example.com/xxx.jpg"
}

Response:
{
  "productType": "spray",
  "scaleConstraint": "miniature",
  "description": "紫色喷雾瓶...",
  "suggestedName": "清新口气喷雾"
}
```

### 3. 生成脚本
```
POST /api/generate-script
Content-Type: application/json

Request Body:
{
  "productName": "智能手表 Pro",
  "category": "electronics",
  "usageMethod": "佩戴在手腕上...",
  "sellingPoints": ["超长续航", "IP68防水"],
  "language": "zh-CN",
  "duration": 15
}

Response:
{
  "shots": [
    {
      "time": "0-3s",
      "scene": "办公室内",
      "action": "主角拿出产品",
      "audio": "台词内容",
      "emotion": "excited"
    }
  ],
  "emotionArc": {
    "start": "curious",
    "end": "satisfied"
  }
}
```

### 4. 生成视频
```
POST /api/generate-video
Content-Type: application/json

Request Body:
{
  "prompt": "脚本内容...",
  "images": ["https://tos.example.com/xxx.jpg"],
  "orientation": "vertical",
  "size": "1080p",
  "duration": 15
}

Response (异步任务):
{
  "status": "processing",
  "task_id": "task_1234567890",
  "message": "视频生成中...",
  "estimatedTime": 120
}

或 (立即完成):
{
  "status": "completed",
  "url": "https://tos.example.com/video.mp4"
}
```

### 5. 查询视频任务状态
```
GET /api/video-task/{task_id}

Response (处理中):
{
  "status": "processing",
  "progress": 45
}

Response (完成):
{
  "status": "completed",
  "video_url": "https://tos.example.com/video.mp4",
  "thumbnail": "https://tos.example.com/thumb.jpg"
}

Response (失败):
{
  "status": "failed",
  "error": "错误信息"
}
```

### 6. 获取用户积分
```
GET /api/user/credits
Content-Type: application/json

Response:
{
  "credits": 520
}
```

### 7. 扣除用户积分
```
POST /api/user/deduct-credits
Content-Type: application/json

Request Body:
{
  "amount": 50
}

Response:
{
  "success": true,
  "remaining": 470
}
```

---

## 🔄 前端调用流程

### 流程 1: 上传图片
```
用户上传图片
  ↓
MainWorkspace.handleFileProcess()
  ↓
api.uploadImage(file)
  ↓
返回TOS URL → 保存到 store
  ↓
打开 DirectorPanel 弹窗
```

### 流程 2: 生成脚本
```
用户点击 "AI 生成" 按钮
  ↓
DirectorPanel.handleGenerateScript()
  ↓
api.generateScript({
  productName,
  category,
  usageMethod,
  sellingPoints,
  language,
  duration
})
  ↓
返回脚本 shots → 格式化为文本 → 填充到 textarea
```

### 流程 3: 生成视频
```
用户点击 "生成视频" 按钮
  ↓
DirectorPanel.handleGenerate()
  ↓
api.generateVideo({
  script,
  productImages,
  orientation,
  resolution,
  duration,
  language
})
  ↓
返回 task_id
  ↓
启动轮询: pollVideoStatus(task_id)
  ↓
每3秒调用 api.queryVideoTask(task_id)
  ↓
status = 'completed' → 扣除积分 → 显示成功
status = 'failed' → 显示失败
status = 'processing' → 继续轮询
```

---

## 🛠️ 错误处理

所有API调用都包含错误处理：

```typescript
try {
  const result = await api.generateVideo(...);
  // 处理成功响应
} catch (error) {
  console.error('视频生成失败:', error);
  alert('视频生成失败，请稍后重试');
}
```

### 降级策略

**图片上传降级**:
- 如果上传到TOS失败，使用本地 base64 继续流程
- 不阻断用户操作

**脚本生成降级**:
- 如果AI生成失败，用户可以手动输入脚本
- 提示用户切换到手动输入模式

---

## 🧪 测试API连接

### 1. 启动后端服务

确保你的 FastAPI 后端运行在 `http://localhost:8000`

```bash
cd backend
python main.py  # 或者 uvicorn main:app --reload
```

### 2. 测试端点

使用浏览器或curl测试：

```bash
# 测试后端是否运行
curl http://localhost:8000

# 测试上传接口
curl -X POST http://localhost:8000/api/upload-image \
  -F "image=@test.jpg"
```

### 3. 启动前端

```bash
npm run dev
```

### 4. 观察控制台

打开浏览器开发者工具，查看：
- Network 标签: 查看API请求和响应
- Console 标签: 查看日志输出

---

## 📦 部署注意事项

### 1. CORS 配置

确保后端允许前端域名的跨域请求：

```python
# FastAPI 后端
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. 环境变量

生产环境配置：

```env
# .env.production
VITE_API_BASE_URL=https://api.your-domain.com
```

### 3. API认证（可选）

如果后端需要认证，在 `/src/app/lib/api.ts` 中添加：

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

---

## 📝 完整的API调用示例

### 示例：完整的视频生成流程

```typescript
// 1. 上传图片
const tosUrl = await api.uploadImage(file);

// 2. 生成脚本
const scriptResult = await api.generateScript({
  productName: "智能手表 Pro",
  category: "electronics",
  usageMethod: "佩戴在手腕上，监测健康数据",
  sellingPoints: ["超长续航7天", "IP68防水"],
  targetCountry: "china",
  language: "zh-CN",
  duration: 15
});

// 3. 生成视频
const videoResult = await api.generateVideo({
  script: scriptResult.shots.map(s => s.action).join('\n'),
  productImages: [tosUrl],
  orientation: "vertical",
  resolution: "1080p",
  duration: 15,
  language: "zh-CN"
});

// 4. 如果是异步任务，轮询状态
if (videoResult.task_id) {
  const intervalId = setInterval(async () => {
    const status = await api.queryVideoTask(videoResult.task_id);
    
    if (status.status === 'completed') {
      clearInterval(intervalId);
      console.log('视频URL:', status.video_url);
    }
  }, 3000);
}
```

---

## 🚀 快速开始

1. **启动后端**
```bash
cd backend
python main.py
```

2. **配置前端**
```bash
cp .env.example .env
# 编辑 .env，确认 VITE_API_BASE_URL=http://localhost:8000
```

3. **启动前端**
```bash
npm install
npm run dev
```

4. **测试功能**
- 上传产品图片
- 填写商品信息
- 配置视频参数
- 生成脚本
- 生成视频

---

## ❓ 常见问题

### Q: API调用失败怎么办？

A: 检查以下几点：
1. 后端服务是否运行
2. `.env` 中的 API 地址是否正确
3. 浏览器控制台的网络请求是否有错误
4. 后端的 CORS 配置是否正确

### Q: 图片上传后显示不出来？

A: 
- 检查后端返回的URL是否可访问
- 如果是TOS URL，确认权限设置
- 查看浏览器控制台的错误信息

### Q: 视频生成一直在轮询？

A: 
- 检查 `queryVideoTask` 接口是否正常返回
- 查看后端日志，确认视频生成任务状态
- 设置轮询超时时间，避免无限轮询

---

## 📞 技术支持

如果遇到API集成问题，请：
1. 查看浏览器开发者工具的 Network 和 Console 标签
2. 检查后端服务日志
3. 确认所有环境变量配置正确
4. 参考本文档的错误处理和测试部分
