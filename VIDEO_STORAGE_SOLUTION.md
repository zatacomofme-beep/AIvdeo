# 视频存储方案说明

## 📹 视频生成完成后得到什么？

### 当前情况
云雾API生成视频完成后，返回的是：
- **视频URL**：`https://sora-cdn.yunwu.ai/outputs/video_abc123.mp4`
- **不是文件本身**，而是托管在云雾服务器上的链接

### 返回数据格式
```json
{
  "status": "completed",
  "video_url": "https://sora-cdn.yunwu.ai/outputs/2024/12/20/video_abc123.mp4",
  "thumbnail": "https://sora-cdn.yunwu.ai/thumbnails/thumb_abc123.jpg",
  "duration": 10,
  "resolution": "1080p"
}
```

---

## 💾 三种存储方案

### 方案A：只存储URL（当前实现）

**存储位置**：浏览器LocalStorage（Zustand持久化）

**存储内容**：
```javascript
{
  id: "video123",
  url: "https://sora-cdn.yunwu.ai/video.mp4",  // 云雾的URL
  thumbnail: "https://sora-cdn.yunwu.ai/thumb.jpg",
  productName: "智能手表",
  createdAt: 1703059200000,
  status: "completed"
}
```

**使用方式**：
- 📺 在线播放：`<video src={video.url} />`
- ⬇️ 下载：`window.open(video.url, '_blank')`

**优点**：
- ✅ 实现简单
- ✅ 不占用自己的存储空间
- ✅ 不需要额外费用

**缺点**：
- ❌ 依赖云雾服务器
- ❌ 链接可能过期（通常30-90天）
- ❌ 如果云雾删除，视频就没了

---

### 方案B：下载到自己的TOS（推荐）✅

**工作流程**：
1. 云雾生成视频 → 返回URL
2. 后端下载视频文件
3. 上传到自己的火山云TOS
4. 返回永久URL

**后端API**：`POST /save-video-to-tos`
```python
@app.post("/save-video-to-tos")
async def save_video_to_tos(req: dict):
    video_url = req.get("video_url")  # 云雾返回的URL
    
    # 1. 下载视频
    response = requests.get(video_url)
    video_content = response.content
    
    # 2. 上传到自己的TOS
    key = f"videos/{date}/video_{id}.mp4"
    tos_client.put_object(
        bucket="sora-2",
        key=key,
        content=BytesIO(video_content)
    )
    
    # 3. 返回永久URL
    saved_url = f"https://sora-2.tos-cn-beijing.volces.com/{key}"
    return {"saved_url": saved_url}
```

**前端调用**：
```typescript
// 视频生成完成后
if (status === 'completed') {
  // 立即保存到自己的TOS
  const saved = await api.saveVideoToTOS(video.url);
  
  // 更新存储的URL为永久URL
  updateVideoStatus(video.id, {
    url: saved.saved_url,  // 使用自己TOS的URL
    original_url: video.url  // 保留原始URL备用
  });
}
```

**优点**：
- ✅ 视频永久属于您
- ✅ 不会过期
- ✅ 可以自定义CDN加速
- ✅ 更快的访问速度

**缺点**：
- ❌ 占用TOS存储空间
- ❌ 产生TOS存储和流量费用
- ❌ 需要额外开发

**成本估算**（火山云TOS）：
- 存储：¥0.12/GB/月（10个10秒视频约100MB = ¥0.012/月）
- 下载流量：¥0.50/GB（100次观看约1GB = ¥0.50）
- 💡 对于个人项目，月费用预计 < ¥5

---

### 方案C：完全下载到本地

**工作流程**：
1. 用户点击"下载"按钮
2. 浏览器下载视频到本地
3. 用户自己管理文件

**前端实现**：
```typescript
const downloadVideo = async (video) => {
  const response = await fetch(video.url);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${video.productName}.mp4`;
  a.click();
  
  URL.revokeObjectURL(url);
};
```

**优点**：
- ✅ 完全控制
- ✅ 不依赖任何服务器

**缺点**：
- ❌ 需要用户手动管理
- ❌ 占用用户设备空间
- ❌ 无法在线播放历史视频

---

## 🎯 推荐方案

### 对于您的项目，建议：

**混合方案**（方案A + 方案B）：

1. **默认使用方案A**：
   - 存储云雾返回的URL
   - 7天内可以正常观看
   - 节省成本

2. **用户可选方案B**：
   - 添加"永久保存"按钮
   - 点击后下载到自己的TOS
   - 重要视频才保存

**实现代码**：

```typescript
// MyVideos.tsx - 添加永久保存按钮
<button 
  onClick={() => savePermanently(video)}
  className="px-3 py-1 bg-blue-500 text-white rounded"
>
  💾 永久保存
</button>

const savePermanently = async (video) => {
  if (video.isPermanent) return;  // 已保存
  
  const result = await api.saveVideoToTOS({
    video_url: video.url,
    video_id: video.id
  });
  
  updateVideoStatus(video.id, {
    url: result.saved_url,
    isPermanent: true
  });
  
  alert('✅ 视频已永久保存到您的存储桶！');
};
```

---

## 📊 存储位置总结

| 方案 | 文件位置 | URL来源 | 过期时间 | 成本 |
|------|---------|---------|---------|------|
| 方案A | 云雾服务器 | `sora-cdn.yunwu.ai` | 30-90天 | 免费 |
| 方案B | 自己的TOS | `sora-2.tos-cn-beijing.volces.com` | 永久 | ¥5/月 |
| 方案C | 用户本地 | 本地文件系统 | 永久 | 免费 |

---

## 🔧 快速实现方案B

### 1. 后端添加保存接口（代码已准备）

在 `backend/main.py` 中添加：
```python
@app.post("/save-video-to-tos")
async def save_video_to_tos(req: dict):
    # ... 见上述代码 ...
```

### 2. 前端添加API方法

在 `src/lib/api.ts` 中：
```typescript
async saveVideoToTOS(params: {
  video_url: string;
  video_id: string;
}): Promise<{ saved_url: string; size: number }> {
  const response = await fetch(`${API_BASE_URL}/save-video-to-tos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return await response.json();
}
```

### 3. 在MyVideos添加保存按钮

```tsx
{video.status === 'completed' && !video.isPermanent && (
  <button onClick={() => savePermanently(video)}>
    💾 永久保存
  </button>
)}
```

---

## ❓ 常见问题

**Q: 云雾的视频链接什么时候过期？**
A: 通常30-90天，具体看云雾的政策

**Q: 保存到TOS要多少钱？**
A: 每个10秒视频约10MB，100个视频约1GB，月存储费¥0.12，流量费按观看次数计算

**Q: 可以自动保存所有视频吗？**
A: 可以，但会增加成本。建议让用户选择重要的视频保存

**Q: 保存失败怎么办？**
A: 原始URL仍然可用，可以稍后重试保存

---

## 📝 建议

1. **先使用方案A**：简单快速，适合MVP
2. **评估用户需求**：如果用户反馈链接过期，再实现方案B
3. **逐步优化**：可以先添加"下载"功能（方案C），再考虑TOS存储

当前您的实现已经使用方案A，如果需要实现方案B，我可以帮您完成完整的代码！
