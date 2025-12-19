这是一个将 **“MindVideo 视觉风格”** 与 **“SoraDirector 业务逻辑”** 完美融合的最终版 **PRD + UI 设计综合文档**。

这份文档是为**全栈开发团队**准备的，可以直接用于立项开发。它规定了产品长什么样（UI）、怎么交互（UX）、以及后台怎么运行（Backend & AI）。

---

#👑 SoraDirector 产品综合开发文档 (PRD + UI Spec)| 项目属性 | 描述 |
| --- | --- |
| **项目名称** | SoraDirector (AI Video Agent for E-Commerce) |
| **版本号** | V3.0 Final |
| **设计风格** | **MindVideo Cyberpunk** (Deep Dark, Neon Purple, Glassmorphism) |
| **前端栈** | **React (Next.js)**, Tailwind CSS, Framer Motion (动画), Zustand (状态) |
| **后端栈** | **Python (FastAPI)**, LangChain, PostgreSQL, Redis, Celery |
| **AI 模型** | Logic: GPT-4o |

---

#第一部分：UI/UX 设计规范 (Design System)**核心理念：** 这是一个“沉浸式的高科技暗房”。用户感觉自己不是在填表单，而是在操作一台未来的视频控制台。

##1. 全局视觉样式 (Visual Identity)参考 **MindVideo.ai** 的视觉语言：

* **背景色 (Canvas):** `#050505` (极致深黑，用于主画布)
* **模块背景 (Surface):** `#121214` (略浅的黑，用于侧边栏、对话框)
* **主色调 (Primary):** `#8A2BE2` (蓝紫色) 到 `#6A5ACD` (板岩蓝) 的线性渐变。
* **高亮色 (Accent):** `#00E5FF` (青色，用于AI思考中的状态) / `#FFD700` (金色，用于付费/升级)。
* **字体 (Typography):** `Inter` 或 `Roboto`。标题加粗，正文精细。
* **质感 (Texture):**
* **Glassmorphism:** 弹窗和浮层使用 `backdrop-filter: blur(12px)` + `bg-opacity-10`。
* **Glow:** 按钮和选中态带有 `box-shadow: 0 0 15px rgba(138, 43, 226, 0.4)`。



##2. 布局结构 (Layout Architecture)页面采用 **三栏式布局**，高度 100vh，无滚动条（内容区内部滚动）。

###A. 左侧导航栏 (Sidebar) - 宽 240px* **样式:** 背景 `#121214`，右侧边框 `1px solid #2A2A2E`。
* **顶部:** Logo (渐变字 **SoraDirector**)。
* **导航项:**
* `Studio` (创作工坊 - 选中高亮: 紫色背景块+左侧光条)
* `Assets` (我的作品)
* `Templates` (模版中心)


* **底部:** 用户卡片。
* 头像 + 昵称。
* **Credits:** 520 (黄色高亮)。
* **Upgrade 按钮:** 渐变背景，呼吸动效。



###B. 中央创作区 (Visual Canvas) - 宽 45% (Flex-1)* **样式:** 背景 `#050505`。这是用户的“监视器”。
* **核心组件:**
* **Preview Stage:** 16:9 或 9:16 的容器，居中显示。
* *空状态:* 虚线框 + "Upload Product Image"。
* *上传后:* 显示产品图。
* *生成后:* 视频播放器 (带有高级控制条)。


* **HUD Overlays (抬头显示):** 在图片上悬浮显示的半透明标签。
* `[💄 Scale: Miniature]` (尺寸锁定)
* `[🖐️ Action: Index Press]` (动作锁定)


* **Timeline Preview:** 底部悬浮的时间轴条，实时显示 GPT 生成的脚本分镜。



###C. 右侧导演控制台 (Director Agent) - 宽 400px* **样式:** 背景 `#121214`，左侧边框 `1px solid #2A2A2E`。
* **顶部:** "AI Director" 标题 + Reset 图标。
* **消息流 (Chat Stream):**
* **Agent 气泡:** 深灰背景 `#1E1E22`，打字机效果。
* **User 气泡:** 紫色渐变背景，右对齐。
* **交互卡片 (Interactive Chips):** 嵌入在消息流中的选项按钮（如 `[印尼]` `[美国]`）。


* **底部操作区:**
* 输入框 (圆角 24px, 背景 `#050505`)。
* **Magic Button:** "Generate Video (50 Credits)" —— 只有当 Prompt 就绪时才点亮，带流光效果。



---

#第二部分：核心功能 PRD (Functional Spec)##模块 1: 创作工坊 (The Studio) - 核心业务###1.1 视觉锚定 (Visual Anchoring)* **交互:** 用户拖拽图片到中央画布。
* **后端 (Vision Analysis):** 调用 GPT-4o-Vision 识别产品。
* **UI 反馈:** Agent 发送消息：“识别到紫色喷雾瓶。为了防止 AI 把它画成水桶，请确认实际大小：”
* *Chips:* `[💄 口红级 (10cm)]` `[📱 手机级]` `[🥤 水瓶级]`


* **逻辑锁:** 用户选择后，左侧 HUD 显示 `[Scale Locked: Miniature]`。后台 Prompt 注入 `(STRICT CONSTRAINT: miniature size, fits in palm)`.

###1.2 交互式选角 (Conversational Casting)* **交互:** Agent 询问：“视频发到哪个国家？主角什么风格？”
* **逻辑 (Slot Filling):**
* User: "印尼，年轻女生，真实一点。"
* **Backend Agent:** 提取 Tags `[Market: ID]`, `[Age: GenZ]`, `[Vibe: Raw/Authentic]`.
* **Prompt Expansion:** 将 Tags 扩写为 `"Indonesian girl, sawo matang skin, slight pores, no heavy makeup..."`


* **UI 反馈:** 左侧出现 **[Character Card]** 小浮窗，显示生成的角色描述摘要。

###1.3 交互式编剧 (Scripting Engine)* **交互:**
* Step 1: 痛点 ("吃完大蒜怕口臭")
* Step 2: 动作 ("偷偷喷")
* Step 3: 语言 ("雅加达俚语")


* **后端 (Anti-Marketing Logic):**
* GPT-4o 生成脚本，**强制**将广告词替换为 UGC 口语。
* **物理动作注入:** 在脚本 05s-08s 处，强制插入 `Action: Index finger presses the pump vertically`.


* **UI 反馈:** 左侧底部出现 **Timeline**，用户可以点击每句台词进行修改。

###1.4 生成与交付* **交互:** 点击 "Generate Video"。
* **状态:**
* 扣除点数。
* 左侧画布变为 **Loading State** (MindVideo 风格的紫色脉冲波纹)。
* 右侧显示 "Rendering... Estimated time: 2 mins"。


* **结果:** 视频自动播放。提供 `Download` (无水印) 和 `Share` 按钮。

##模块 2: 账户与支付 (Account & Billing)###2.1 登录体系* **微信扫码 (WeChat):** 核心登录方式。
* **JWT 鉴权:** 登录后颁发 Token，存储在 Cookie。

###2.2 充值中心* **点数制 (Credits):**
* 生成 Prompt = 2 点。
* 生成视频 = 50 点。


* **支付:** 支付宝/微信 Native 支付。
* **UI:** 价格卡片使用 Glassmorphism 风格，热销套餐带有 "Best Value" 金色角标。

##模块 3: 管理后台 (Admin Panel)*仅超级管理员可见，独立 URL `/admin*`

* **API 配置:**
* 配置 OpenAI Keys (轮询池)。
* 配置 Sora API Keys。
* 设置 **System Prompt** 版本 (V1/V2)，用于快速调整 AI 导演的性格。


* **用户管理:** 封禁、赠送点数。
* **模版 CMS:** 后台添加新的“预设角色”或“脚本模版”，前端 API 动态拉取，无需发版。

---

#第三部分：开发实现细节 (Implementation Details)##1. 数据库设计 (PostgreSQL)```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wechat_openid VARCHAR(100),
    email VARCHAR(100),
    credits INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 项目表 (保存一次创作的所有上下文)
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    
    -- 视觉锚点
    visual_img_url TEXT,
    product_type VARCHAR(50), -- 'spray', 'bottle'
    scale_constraint VARCHAR(50), -- 'miniature'
    
    -- 角色设定
    character_prompt TEXT, -- 'Indonesian girl...'
    
    -- 脚本设定
    script_json JSONB, -- [{time: '0-5s', audio: '...'}, ...]
    
    -- 结果
    final_sora_prompt TEXT,
    sora_video_url TEXT,
    status VARCHAR(20) -- 'draft', 'processing', 'completed'
);

-- 订单表
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    amount_cny DECIMAL(10,2),
    credits_added INT,
    status VARCHAR(20) -- 'pending', 'paid'
);

```

##2. 后端 Agent 逻辑 (Python/LangChain)**System Prompt 核心指令 (Anti-Hallucination & Anti-Marketing):**

```python
SYSTEM_PROMPT = """
You are the AI Director for Sora 2 e-commerce videos.
Your goal is to generate prompts that create REALISTIC, UGC-style videos, NOT commercials.

RULES:
1. PHYSICS: If product is small (e.g., spray), ALWAYS enforce 'Miniature size' and 'Index finger press'. NEVER allow 'squeezing'.
2. SCRIPT: Translate user intent into {language_style}. NEVER use 'Buy now'. Use distinct emotions: Start (Anxious/Sweaty) -> End (Relieved/Fresh).
3. CAMERA: If user wants 'Selfie', lock camera to 'High-angle, 45-deg above eye level'.
"""

```

##3. 前端组件交互 (React Components)**ChatInterface.tsx (对话流):**

```tsx
// 模拟 MindVideo 的流式输出和交互卡片
return (
  <div className="flex flex-col h-full bg-[#121214]">
    <ScrollArea className="flex-1 p-4 space-y-6">
      {messages.map((msg) => (
        <div className={msg.role === 'ai' ? 'justify-start' : 'justify-end'}>
          {/* 交互卡片渲染逻辑 */}
          {msg.type === 'scale_selector' && (
             <div className="flex gap-2 mt-2">
               <Chip label="💄 口红级" onClick={() => setScale('mini')} />
               <Chip label="🥤 水瓶级" onClick={() => setScale('bottle')} />
             </div>
          )}
        </div>
      ))}
    </ScrollArea>
    <InputArea onSend={handleSend} disabled={isGenerating} />
  </div>
);

```

**ProjectState.ts (Zustand 状态管理):**

```ts
interface ProjectState {
  image: string | null;
  constraints: {
    scale: 'mini' | 'normal';
    action: 'press' | 'squeeze';
  };
  script: ScriptItem[];
  // ... actions
}

```

---

#第四部分：开发路线图 (Roadmap)1. **Phase 1 (MVP - 2周):**
* 完成 UI 框架搭建 (MindVideo 风格)。
* 实现图片上传 + 简单的 Vision 分析。
* 实现 GPT-4o 对话生成 Prompt。
* 伪造 Sora API 返回（用占位视频测试流程）。


2. **Phase 2 (Alpha - 2周):**
* 接入真实 Sora 2 API。
* 完善物理防幻觉 Prompt 逻辑（重点调试喷雾类产品）。
* 接入微信登录。


3. **Phase 3 (Beta - 2周):**
* 接入支付系统。
* 上线管理后台。
* 开放内测。



这份文档不仅告诉了你**要做什么**，还通过 MindVideo 的风格定义了**做出来要有多酷**。现在，你可以把这份文档发给你的 UI 设计师和开发工程师了。