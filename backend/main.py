from __future__ import annotations

import os
import time
import uuid
import asyncio
import requests
import base64
from typing import Any, List, Optional
from io import BytesIO

import boto3
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.openapi.docs import get_swagger_ui_html
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


# ======================
# 配置 - 从环境变量读取
# ======================

# TOS 存储配置
TOS_ENDPOINT = os.getenv("TOS_ENDPOINT", "https://tos-cn-beijing.volces.com")
TOS_REGION = os.getenv("TOS_REGION", "cn-beijing")
TOS_BUCKET = os.getenv("TOS_BUCKET", "sora-2")
TOS_ACCESS_KEY = os.getenv("TOS_ACCESS_KEY")
TOS_SECRET_KEY = os.getenv("TOS_SECRET_KEY")

# AI 模型配置
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash-exp")  # 使用支持视觉的模型
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://yunwu.ai")

VIDEO_MODEL_NAME = os.getenv("VIDEO_MODEL_NAME", "sora-2-portrait-hd")
VIDEO_API_KEY = os.getenv("VIDEO_GENERATION_API_KEY")
VIDEO_BASE_URL = os.getenv("VIDEO_GENERATION_ENDPOINT", "https://yunwu.ai")


if not TOS_ACCESS_KEY or not TOS_SECRET_KEY:
    print("WARNING: TOS_ACCESS_KEY / TOS_SECRET_KEY 未配置,上传接口会失败。")
else:
    print(f"[TOS Config] AK: {TOS_ACCESS_KEY[:15]}...")
    print(f"[TOS Config] SK: {TOS_SECRET_KEY[:15]}...")
    print(f"[TOS Config] Bucket: {TOS_BUCKET}")
    print(f"[TOS Config] Region: {TOS_REGION}")
    print(f"[TOS Config] Endpoint: {TOS_ENDPOINT}")

if not LLM_API_KEY:
    print("WARNING: LLM_API_KEY 未配置，聊天功能将使用模拟模式。")

if not VIDEO_API_KEY:
    print("WARNING: VIDEO_GENERATION_API_KEY 未配置，视频生成功能将使用模拟模式。")

# TOS 客户端（火山云原生SDK）
import tos

# TOS SDK会自动使用virtual-host方式访问
# endpoint格式: https://tos-{region}.volces.com (不包含bucket名)
tos_client = tos.TosClientV2(
    ak=TOS_ACCESS_KEY,
    sk=TOS_SECRET_KEY,
    endpoint=TOS_ENDPOINT,  # https://tos-cn-beijing.volces.com
    region=TOS_REGION,      # cn-beijing
    enable_crc=False
)

print(f"[TOS] SDK初始化成功")
print(f"[TOS] Endpoint: {TOS_ENDPOINT}")
print(f"[TOS] Region: {TOS_REGION}")
print(f"[TOS] Bucket: {TOS_BUCKET}")
print(f"[TOS] Virtual-Host模式: 自动启用")

print("="*80)
print("[SERVER INFO] SoraDirector Backend Starting")
print("[SERVER INFO] Build Version: 2025-12-17-v3-sora2-optimized")
print("[SERVER INFO] 新增功能：")
print("  - 产品理解：负面提示词生成（避免产品变形）")
print("  - 脚本生成：使用Sora 2标准模板结构")
print("  - 视频生成：添加产品材质和几何描述")
print("[SERVER INFO] API Endpoints: /understand-product, /analyze-market, /generate-strategy, etc.")
print("="*80)

# AI 客户端（用于对话和视频生成）
ai_client = None
if LLM_API_KEY:
    ai_client = OpenAI(
        api_key=LLM_API_KEY,
        base_url=f"{LLM_BASE_URL}/v1"  # 云雾API需要加 /v1 后缀
    )


# ======================
# Pydantic 数据模型
# ======================

class Chip(BaseModel):
    label: str
    value: str


class Message(BaseModel):
    id: str
    role: str  # 'ai' | 'user'
    content: str
    type: Optional[str] = None  # 'text' | 'scale_selector' | 'script_review'
    chips: Optional[List[Chip]] = None


class ProjectUpdate(BaseModel):
    scale: Optional[str] = None  # 'mini' | 'normal' | 'large'
    constraints: Optional[dict] = None  # 存储约束信息
    character: Optional[dict] = None  # 角色信息
    script: Optional[List[Any]] = None
    product_name: Optional[str] = None  # 产品名称


class ChatResponse(BaseModel):
    message: Message
    projectUpdate: Optional[ProjectUpdate] = None


class ChatRequest(BaseModel):
    content: str
    context: Optional[dict[str, Any]] = None
    image_url: Optional[str] = None  # 支持传入图片URL
    history: Optional[List[dict]] = None  # 对话历史 [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]


class LockPhysicsRequest(BaseModel):
    scale: str  # 'mini' | 'normal' | 'large'


class GenerateVideoRequest(BaseModel):
    prompt: str
    images: Optional[List[str]] = []  # 图片URL列表
    orientation: Optional[str] = "portrait"  # portrait 竖屏, landscape 横屏
    size: Optional[str] = "large"  # small (720p) 或 large
    duration: Optional[int] = 10  # 视频时长，支持 10 秒
    watermark: Optional[bool] = False  # 是否有水印
    private: Optional[bool] = True  # 是否隐藏视频


class VideoTaskRequest(BaseModel):
    task_id: str


class ProductInfo(BaseModel):
    """产品信息表单数据"""
    productName: str
    size: Optional[str] = None
    weight: Optional[str] = None
    sellingPoints: str
    targetMarket: str
    ageGroup: str
    gender: str
    style: str


class GenerateScriptRequest(BaseModel):
    """一次性生成脚本请求"""
    productInfo: ProductInfo
    imageUrl: Optional[str] = None  # 产品图片base64

class GenerateScriptFromProductRequest(BaseModel):
    """新业务流程：根据商品信息生成脚本"""
    productName: str
    productImages: List[str]  # 5张商品图片URL
    usageMedia: dict  # 使用方法：{"type": "video"|"images"|"text", "videoUrl": ..., "imageUrls": ..., "textDescription": ...}

class UnderstandProductRequest(BaseModel):
    """B 阶段：产品理解请求"""
    imageUrl: Optional[str] = None
    imageBase64: Optional[str] = None

# B 阶段：产品理解返回结构
class SizeOption(BaseModel):
    label: str
    value: str  # 'mini' | 'normal' | 'large'
    description: Optional[str] = None

class ProductUnderstanding(BaseModel):
    productName: Optional[str] = None
    productType: Optional[str] = None
    attributes: Optional[dict] = None
    sizeOptions: Optional[List[SizeOption]] = None
    negativePrompts: Optional[List[str]] = None  # 负面提示词，用于避免产品变形

class MarketAnalysisRequest(BaseModel):
    productUnderstanding: Optional[dict] = None
    overrides: Optional[dict] = None

class StrategyRequest(BaseModel):
    productUnderstanding: Optional[dict] = None
    marketAnalysis: Optional[dict] = None

class MatchStyleRequest(BaseModel):
    productUnderstanding: Optional[dict] = None
    marketAnalysis: Optional[dict] = None
    creativeStrategy: Optional[dict] = None

class GenerateScriptsRequest(BaseModel):
    productUnderstanding: Optional[dict] = None
    marketAnalysis: Optional[dict] = None
    creativeStrategy: Optional[dict] = None
    visualStyle: Optional[dict] = None


# ======================
# FastAPI 应用初始化
# ======================

app = FastAPI(title="SoraDirector Backend", version="0.1.0", docs_url=None, redoc_url=None, openapi_url="/openapi.json")

# CORS：开发阶段先全放开
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/docs", include_in_schema=False)
def fallback_docs():
    """
    自定义文档页面（本地渲染 OpenAPI，避免外网 CDN 依赖）
    """
    html = """
    <!doctype html><html><head><meta charset="utf-8"><title>SoraDirector Backend Docs</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:24px;}
      h1{font-size:20px;margin:0 0 16px;}
      ul{padding-left:18px;}
      code{background:#f2f4f7;padding:2px 6px;border-radius:4px;}
      .path{margin:6px 0;}
    </style>
    </head><body>
    <h1>API Endpoints</h1>
    <div id="content">Loading OpenAPI...</div>
    <p><a href="/swagger" target="_blank">打开标准 Swagger UI</a></p>
    <script>
    fetch('/openapi.json').then(r=>r.json()).then(spec=>{
      const paths = spec.paths || {};
      let html = '<ul>';
      const order = ['get','post','put','patch','delete'];
      for (const [p, ops] of Object.entries(paths)) {
        for (const m of order) {
          if (ops[m]) {
            const op = ops[m];
            const sum = op.summary || '';
            html += `<li class="path"><code>${m.toUpperCase()}</code> <code>${p}</code> ${sum ? ' - '+sum : ''}</li>`;
          }
        }
      }
      html += '</ul>';
      document.getElementById('content').innerHTML = html || 'No endpoints found';
    }).catch(err=>{
      document.getElementById('content').textContent = 'OpenAPI 加载失败: ' + err;
    });
    </script>
    </body></html>
    """
    return HTMLResponse(content=html)

@app.get("/swagger", include_in_schema=False)
def swagger_ui():
    """
    标准 Swagger UI（依赖外网 CDN）
    """
    return get_swagger_ui_html(openapi_url="/openapi.json", title="SoraDirector Backend - Swagger UI")


# ======================
# AI 工具函数
# ======================

def url_to_base64(image_url: str) -> str:
    """
    将图片URL转换为base64编码
    """
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        image_data = response.content
        base64_str = base64.b64encode(image_data).decode('utf-8')
        
        # 获取图片类型
        content_type = response.headers.get('Content-Type', 'image/jpeg')
        return f"data:{content_type};base64,{base64_str}"
    except Exception as e:
        print(f"[ERROR] 图片转换base64失败: {e}")
        return None

async def chat_with_ai(prompt: str, system_prompt: str = None, image_url: str = None, history: List[dict] = None) -> str:
    """
    使用 AI 对话模型生成回复（支持多模态+对话历史）
    image_url 参数可以是 URL 或 base64 data URL
    history: 对话历史 [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
    """
    if not ai_client:
        # 如果没有配置 API Key，返回默认回复
        return "收到。正在分析您的请求并检索约束数据库..."
    
    try:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # 添加历史对话（最近10轮）
        if history:
            messages.extend(history[-20:])  # 最近10轮（每轮2条）
        
        # 如果有图片，转换为base64并使用多模态格式
        if image_url:
            # 判断是否已经是base64格式
            if image_url.startswith('data:image'):
                # 已经是base64，直接使用
                base64_image = image_url
                print(f"[DEBUG] 使用前端传入的base64图片，长度: {len(base64_image)}")
            else:
                # 是URL，需要转换
                base64_image = url_to_base64(image_url)
                if not base64_image:
                    # 转换失败，仅发送文本
                    messages.append({"role": "user", "content": prompt})
                    print(f"[DEBUG] 图片转换失败，仅发送文本")
                else:
                    print(f"[DEBUG] URL转换为base64，长度: {len(base64_image)}")
            
            if base64_image:
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": base64_image}}
                    ]
                })
        else:
            messages.append({"role": "user", "content": prompt})
        
        print(f"[DEBUG] 调用AI，模型: {LLM_MODEL_NAME}, 消息: {messages}")
        
        response = ai_client.chat.completions.create(
            model=LLM_MODEL_NAME,
            messages=messages,
            temperature=0.7,
            max_tokens=2000  # 增加token限制
        )
        
        print(f"[DEBUG] AI原始响应类型: {type(response)}")
        print(f"[DEBUG] AI原始响应: {response}")
        
        # 详细检查choices
        if hasattr(response, 'choices'):
            print(f"[DEBUG] choices数量: {len(response.choices)}")
            if len(response.choices) > 0:
                first_choice = response.choices[0]
                print(f"[DEBUG] 第一个choice: {first_choice}")
                print(f"[DEBUG] message: {first_choice.message}")
                print(f"[DEBUG] message.content: {first_choice.message.content}")
                print(f"[DEBUG] content类型: {type(first_choice.message.content)}")
                print(f"[DEBUG] content长度: {len(first_choice.message.content) if first_choice.message.content else 0}")
        
        # 处理云雾API的响应格式
        # 检查是否有 choices 属性
        if hasattr(response, 'choices') and len(response.choices) > 0:
            content = response.choices[0].message.content
            print(f"[DEBUG] 提取内容(方式1): {content}")
            return content or "AI返回了空内容"
        # 如果是字典格式
        elif isinstance(response, dict):
            if 'choices' in response and len(response['choices']) > 0:
                content = response['choices'][0]['message']['content']
                print(f"[DEBUG] 提取内容(方式2): {content}")
                return content or "AI返回了空内容"
            elif 'content' in response:
                print(f"[DEBUG] 提取内容(方式3): {response['content']}")
                return response['content'] or "AI返回了空内容"
        # 如果直接返回字符串
        elif isinstance(response, str):
            print(f"[DEBUG] 提取内容(方式4): {response}")
            return response or "AI返回了空内容"
        else:
            print(f"[ERROR] AI 响应格式异常: {type(response)}, {response}")
            return "收到。正在分析您的请求..."
            
    except Exception as e:
        print(f"[ERROR] AI 对话错误: {e}")
        import traceback
        traceback.print_exc()  # 打印详细堆栈
        return f"抱歉，AI 服务暂时不可用。请稍后再试。"


async def generate_video_with_ai(prompt: str, images: List[str] = None, orientation: str = "portrait", 
                                size: str = "large", duration: int = 10, watermark: bool = False, 
                                private: bool = True, product_attributes: dict = None, negative_prompts: List[str] = None) -> dict:
    """
    使用 Sora API 生成视频（云雾 API）
    PRD Phase 4: Prompt Assembly - 整合所有约束生成最终Prompt
    
    根据Sora 2教程优化：
    1. 强调产品的结构和材质（geometric, solid, sturdy, clean lines, professional product shot）
    2. 添加负面提示词避免变形（deformed, distorted, malformed, bad anatomy）
    3. 使用专业摄影术语（low-angle shot, shallow depth of field）
    """
    # 优化Prompt：添加产品结构和材质描述
    enhanced_prompt = prompt
    
    if product_attributes:
        material_desc = []
        if product_attributes.get('material'):
            material_desc.append(f"{product_attributes['material']} material")
        if product_attributes.get('shape'):
            material_desc.append(f"{product_attributes['shape']} shape")
        if product_attributes.get('color'):
            material_desc.append(f"{product_attributes['color']} color")
        
        # 添加通用产品摄影要求
        material_desc.extend(["geometric", "solid", "sturdy", "clean lines", "professional product shot"])
        
        if material_desc:
            enhanced_prompt = f"{prompt}\n\nProduct details: {', '.join(material_desc)}"
    
    # 添加负面提示词
    if negative_prompts and len(negative_prompts) > 0:
        enhanced_prompt = f"{enhanced_prompt}\n\nAvoid: {', '.join(negative_prompts)}"
    if not VIDEO_API_KEY:
        # 如果没有配置，返回模拟 URL
        await asyncio.sleep(1)
        return {
            "url": "https://media.w3.org/2010/05/sintel/trailer_hd.mp4",
            "status": "completed"
        }
    
    try:
        # 云雾 Sora API 调用
        headers = {
            "Authorization": f"Bearer {VIDEO_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # 构建请求数据（符合官方 API 规范）
        payload = {
            "model": VIDEO_MODEL_NAME,
            "prompt": enhanced_prompt,  # 使用增强后的Prompt
            "images": images if images else [],
            "orientation": orientation,
            "size": size,
            "duration": duration,
            "watermark": watermark,
            "private": private
        }
        
        print(f"[VIDEO GENERATION] Enhanced Prompt: {enhanced_prompt[:200]}...")  # 打印前200个字符
        
        # 调用创建视频任务接口（云雾 API）
        response = requests.post(
            f"{VIDEO_BASE_URL}/v1/video/create",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"API 请求失败: {response.status_code} - {response.text}")
        
        result = response.json()
        
        # 根据实际 API 响应结构提取数据
        # 通常 Sora API 会返回任务 ID，需要轮询查询状态
        if "id" in result:
            # 异步任务，返回任务 ID
            task_id = result["id"]
            
            # 轮询查询任务状态（最多等待 60 秒）
            max_attempts = 60
            for attempt in range(max_attempts):
                await asyncio.sleep(2)  # 每 2 秒查询一次
                
                status_response = requests.get(
                    f"{VIDEO_BASE_URL}/v1/video/query",
                    headers=headers,
                    params={"id": task_id},
                    timeout=10
                )
                
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    
                    # 检查任务状态
                    task_status = status_data.get("status", "")
                    
                    if task_status == "completed":
                        # 任务完成，返回视频 URL
                        video_url = status_data.get("video_url")
                        return {
                            "url": video_url,
                            "status": "completed",
                            "task_id": task_id,
                            "enhanced_prompt": status_data.get("enhanced_prompt")
                        }
                    elif task_status == "failed":
                        # 任务失败
                        error_msg = status_data.get("error", "未知错误")
                        raise Exception(f"视频生成失败: {error_msg}")
            
            # 超时未完成
            return {
                "status": "processing",
                "task_id": task_id,
                "message": "视频生成中，请稍后查询任务状态"
            }
        
        # 如果直接返回结果（同步模式）
        elif "url" in result or "data" in result:
            video_url = result.get("url") or result.get("data", {}).get("url")
            return {
                "url": video_url,
                "status": "completed"
            }
        else:
            # 未知响应格式
            return {
                "status": "unknown",
                "raw_response": result
            }
            
    except Exception as e:
        print(f"视频生成错误: {e}")
        # 如果失败，返回模拟 URL
        return {
            "url": "https://media.w3.org/2010/05/sintel/trailer_hd.mp4",
            "status": "error",
            "error": str(e)
        }


# ======================
# 工具函数
# ======================

def build_public_url(bucket: str, key: str) -> str:
    """
    根据 TOS S3 兼容域名生成访问 URL
    火山云 TOS 访问格式：https://<bucket>.<endpoint>/<key>
    """
    endpoint = TOS_ENDPOINT.replace("https://", "").replace("http://", "")
    return f"https://{bucket}.{endpoint}/{key}"


# ======================
# 健康检查
# ======================

@app.get("/")
async def root():
    return {"message": "SoraDirector Backend is running", "version": "0.2.0", "build": "2025-12-17-v3-sora2-optimized"}


@app.get("/health")
async def health_check():
    print("[HEALTH CHECK] Server version: 2025-12-17-v3-sora2-optimized")
    return {"status": "ok", "version": "2025-12-17-v3-sora2-optimized"}


# ======================
# 1. 上传图片到火山云 TOS
# ======================

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    # 支持图片和视频上传
    allowed_types = ["image/", "video/"]
    if not file.content_type or not any(file.content_type.startswith(t) for t in allowed_types):
        raise HTTPException(status_code=400, detail="只允许上传图片或视频文件")

    # 生成唯一文件名
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    key = f"uploads/{time.strftime('%Y%m%d')}/{int(time.time()*1000)}-{uuid.uuid4().hex}{ext}"

    print(f"[Upload] 开始上传: {file.filename}")
    print(f"[Upload] Bucket: {TOS_BUCKET}")
    print(f"[Upload] Key: {key}")
    print(f"[Upload] Endpoint: {TOS_ENDPOINT}")
    print(f"[Upload] AK: {TOS_ACCESS_KEY[:10]}...")

    try:
        # 读取文件内容
        content = await file.read()
        
        # 使用TOS SDK上传
        result = tos_client.put_object(
            bucket=TOS_BUCKET,
            key=key,
            content=content,
            content_type=file.content_type
        )
        
        print(f"[Upload] 上传成功: {key}")
        print(f"[Upload] RequestID: {result.request_id}")
        
    except tos.exceptions.TosServerError as e:
        print(f"[Upload Error] TOS服务器错误: {e.status_code}")
        print("="*80)
        print(f"RequestID: {e.request_id}")
        print(f"Code: {e.code}")
        print(f"Message: {e.message}")
        print(f"HostID: {e.host_id}")
        print("="*80)
        raise HTTPException(status_code=500, detail=f"上传失败: {e.message}")
        
    except tos.exceptions.TosClientError as e:
        print(f"[Upload Error] TOS客户端错误: {e.message}")
        raise HTTPException(status_code=500, detail=f"上传失败: {e.message}")
        
    except Exception as e:
        print(f"[Upload Error] 未知错误: {type(e).__name__}")
        print(f"[Upload Error] 错误详情: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")

    url = build_public_url(TOS_BUCKET, key)
    print(f"[Upload] 返回URL: {url}")
    return {"url": url}


# ======================
# 2. AI 聊天接口
# ======================

@app.post("/chat", response_model=ChatResponse)
async def send_chat(req: ChatRequest):
    content = req.content
    lower = content.lower()
    now_id = str(int(time.time() * 1000))
    
    # 系统提示词：定义 AI 导演的角色（按PRD要求）
    system_prompt = """你是 SoraDirector 的 AI 导演助手，帮助用户创作产品视频。

工作流程：
1. 视觉锁定：识别产品 → 选择尺寸
2. 交互选角：提取市场/年龄/性别/风格，生成角色卡
3. 交互编剧：收集痛点 → 动作 → 语言风格，生成脚本
4. 生成视频

角色定位：
- 不是简单的问答机器人，而是智能导演助手
- 能理解上下文，自动判断当前阶段
- 根据用户回答提取结构化信息

重要规则：
1. LANGUAGE: 必须始终用中文对话！用户提到的语言（泰语/印尼语）是脚本语言，不是对话语言
2. CONVERSATIONAL: 一次一个问题，等待用户回答
3. CONTEXT-AWARE: 根据对话历史判断当前阶段，自然进行对话
4. MEMORY: 你能看到完整的对话历史，不要重复问已知问题

结构化数据输出：
- 当用户描述了市场/人群/风格时，在回复末尾添加：
  CHARACTER_DATA: {{"market": "市场", "age": "年龄段", "gender": "性别", "vibe": "风格"}}
  
- 当用户提供了语言风格且之前已收集了痛点和动作时，生成脚本并添加：
  SCRIPT_DATA: [{{"time": "0-3s", "audio": "台词", "emotion": "情绪"}}, ...]

回答风格：简洁、专业、友好。"""
    
    # 逻辑分支 1: 识别容器/产品（按PRD 1.1 视觉锁定）
    # 如果有图片且是请求识别产品，返回尺寸选择器
    if req.image_url and ("识别" in content or "分析" in content):
        # 调用AI识别产品并生成适配的尺寸选项
        try:
            vision_prompt = f"""{content}

请识别这个产品，并根据产品类型推荐3个合适的尺寸参考物。

返回JSON格式：
{{
  "product_name": "产品名称",
  "product_type": "产品类型（如：喷雾瓶/衣服/食物/电子产品等）",
  "size_options": [
    {{"label": "参考物名称+emoji（如：💄口红级）", "value": "mini", "description": "约10cm"}},
    {{"label": "参考物名称+emoji", "value": "normal", "description": "约30cm"}},
    {{"label": "参考物名称+emoji", "value": "large", "description": "约50cm+"}}
  ]
}}

示例1（喷雾瓶）：
- 💄 口红级 (10cm)
- 🥤 矿泉水瓶级 (30cm)
- 🍾 大酒瓶级 (50cm+)

示例2（衣服）：
- 👶 婴儿装 (小号)
- 👕 成人T恤 (中号)
- 🧥 外套大衣 (大号)

示例3（食物）：
- 🍪 饼干级 (小份)
- 🍔 汉堡级 (中份)
- 🍕 披萨级 (大份)

请根据识别的产品类型，给出最合适的参考物。"""
            
            ai_response = await chat_with_ai(vision_prompt, system_prompt, image_url=req.image_url)
            
            # 解析JSON
            import json
            import re
            json_match = re.search(r'\{[\s\S]*\}', ai_response)
            if json_match:
                product_data = json.loads(json_match.group())
                product_name = product_data.get('product_name', '该产品')
                size_options = product_data.get('size_options', [])
                
                # 如果AI返回了自定义选项，使用它们；否则用默认值
                if size_options and len(size_options) >= 3:
                    chips = [
                        Chip(label=opt['label'], value=opt['value'])
                        for opt in size_options[:3]
                    ]
                else:
                    # 默认选项（通用）
                    chips = [
                        Chip(label="🤏 迷你级", value="mini"),
                        Chip(label="👐 标准级", value="normal"),
                        Chip(label="🙌 超大级", value="large"),
                    ]
                
                msg = Message(
                    id=now_id,
                    role="ai",
                    content=f"识别到{product_name}。为了防止AI产生幻觉搞错尺寸，请确认实际大小：",
                    type="scale_selector",
                    chips=chips,
                )
                # 存储产品名称
                update = ProjectUpdate(product_name=product_name)
                return ChatResponse(message=msg, projectUpdate=update)
                
        except Exception as e:
            print(f"AI识别错误: {e}")
            import traceback
            traceback.print_exc()
            # 失败时返回默认尺寸选择器
            msg = Message(
                id=now_id,
                role="ai",
                content="图片已上传成功！为了防止AI产生幻觉搞错尺寸，请确认实际大小：",
                type="scale_selector",
                chips=[
                    Chip(label="💄 口红级 (10cm)", value="mini"),
                    Chip(label="🥤 矿泉水瓶级", value="normal"),
                    Chip(label="🍾 大酒瓶级", value="large"),
                ],
            )
            return ChatResponse(message=msg)
    
     # 使用真实 AI 生成回复（一次对话完成所有任务）
    try:
        # 直接进行自然对话，让AI根据上下文智能响应
        # AI会看到完整历史，自己判断该做什么
        ai_response = await chat_with_ai(content, system_prompt, image_url=req.image_url, history=req.history)
        
        # 尝试解析AI返回的结构化数据（如果有）
        import json
        import re
        
        # 检查是否包含角色信息（casting阶段）
        character_match = re.search(r'CHARACTER_DATA:\s*\{([^}]+)\}', ai_response)
        if character_match:
            try:
                character_json = '{' + character_match.group(1) + '}'
                character_data = json.loads(character_json)
                msg = Message(
                    id=now_id,
                    role="ai",
                    content=ai_response.replace(f'CHARACTER_DATA: {character_json}', '').strip(),
                    type="text",
                )
                update = ProjectUpdate(character=character_data)
                return ChatResponse(message=msg, projectUpdate=update)
            except:
                pass
        
        # 检查是否包含脚本数据（scripting阶段）
        script_match = re.search(r'SCRIPT_DATA:\s*\[(.*?)\]', ai_response, re.DOTALL)
        if script_match:
            try:
                script_json = '[' + script_match.group(1) + ']'
                script_data = json.loads(script_json)
                msg = Message(
                    id=now_id,
                    role="ai",
                    content=ai_response.replace(f'SCRIPT_DATA: {script_json}', '').strip(),
                    type="text",
                )
                update = ProjectUpdate(script=script_data)
                return ChatResponse(message=msg, projectUpdate=update)
            except:
                pass
        
        # 普通对话回复
        msg = Message(
            id=now_id,
            role="ai",
            content=ai_response,
            type="text",
        )
        return ChatResponse(message=msg)
    except Exception as e:
        print(f"聊天错误: {e}")
        import traceback
        traceback.print_exc()
        # 如果 AI 调用失败，返回默认回复
        msg = Message(
            id=now_id,
            role="ai",
            content="收到。正在分析您的请求并检索约束数据库...",
            type="text",
        )
        return ChatResponse(message=msg)


# ======================
# 3. 一次性生成脚本（新架构）
# ======================

@app.post("/generate-script")
async def generate_script(req: GenerateScriptRequest):
    """
    基于产品信息+图片，一次性生成完整视频脚本
    新架构：表单驱动 + AI一键生成
    """
    try:
        info = req.productInfo
        
        # 构建AI Prompt - 使用Sora 2标准模板结构
        prompt = f"""你是专业的视频脚本创作导演。根据以下产品信息和图片，创作一个10秒的UGC风格短视频脚本。

产品信息：
- 商品名称：{info.productName}
- 尺寸规格：{info.size or '未提供'}
- 重量：{info.weight or '未提供'}
- 核心卖点：{info.sellingPoints}

目标用户：
- 市场：{info.targetMarket}
- 年龄段：{info.ageGroup}
- 性别：{info.gender}
- 视频风格：{info.style}

请按照Sora 2标准Prompt模板结构返回JSON：
{{
  "videoStyle": "视频风格描述（如：真实手持视频，casual对话风格，小企业主与朋友聊天，自然且不做作，轻微相机抖动，竖屏视频，15秒）",
  "scene": "场景描述（如：简单办公室，白墙背景，杂乱的产品盒堆叠和随机样品，空间感觉小而实用，像是典型的跨境电商工作空间）",
  "camera": "镜头运动（如：Front-facing selfie camera, eye-level, medium to medium-close shot, subtle handheld movement）",
  "tonePacing": "节奏和基调（如：轻松、友好、对话式。听起来像和朋友聊天，不是推销，自然停顿，轻松表达，简单节奏）",
  "character": "角色描述（如：30多岁的小型跨境电商主，穿着休闲服（帽衫或T恤），看起来普通但舒适且容易接近，脚踏实地、实用、诚实）",
  "script": [
    {{
      "time": "0-3s",
      "scene": "场景描述",
      "action": "人物动作",
      "audio": "视频台词/画外音",
      "emotion": "情绪状态"
    }}
  ],
  "audio": "音频描述（如：清晰的口述，无背景音乐，轻微室内环境音）",
  "overallFeeling": "整体感觉（如：与朋友聊天的氛围，低压力，高度可信，草根创业者能量）"
}}

要求：
1. 生成一个符合{info.style}风格的短视频脚本
2. 包含3-4个分镜场景，总时长10秒
3. 使用{info.targetMarket}市场常用的语言风格
4. 采用UGC口语化表达，避免广告语言
5. 情绪要有对比：开始焦虑/痛点 → 结束轻松/满意
6. camera字段使用专业摄影术语（如：low-angle shot, dolly zoom, shallow depth of field）

仅返回JSON，不要其他文字。"""
        
        # 调用AI生成脚本
        system_prompt = """你是专业的短视频脚本创作导演，擅长为电商产品创作UGC风格的短视频内容。
你的作品特点：
1. 口语化、真实感强，不使用广告语
2. 情绪对比鲜明，有痛点有解决
3. 符合目标市场的文化习惯和语言风格
4. 分镜结构清晰，节奏紧凑"""
        
        ai_response = await chat_with_ai(prompt, system_prompt, image_url=req.imageUrl)
        
        # 解析AI返回的JSON
        import json
        import re
        
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if not json_match:
            raise HTTPException(status_code=500, detail="AI生成脚本失败，格式错误")
        
        result = json.loads(json_match.group())
        
        return {
            "success": True,
            "script": result.get('script', []),
            "targetAudience": result.get('targetAudience', {}),
            "visualPrompt": result.get('visualPrompt', '')
        }
        
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
        raise HTTPException(status_code=500, detail=f"AI返回数据解析失败: {str(e)}")
    except Exception as e:
        print(f"脚本生成错误: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"生成脚本失败: {str(e)}")

@app.post("/generate-script-from-product")
async def generate_script_from_product(req: GenerateScriptFromProductRequest):
    """
    新业务流程：根据5张商品图片+使用方法生成视频脚本
    """
    try:
        # 验证输入
        if len(req.productImages) != 5:
            raise HTTPException(status_code=400, detail="必须提供恰好5张商品图片")
        
        if not req.productName:
            raise HTTPException(status_code=400, detail="商品名称不能为空")
        
        if not req.usageMedia or not req.usageMedia.get('type'):
            raise HTTPException(status_code=400, detail="必须提供使用方法说明")
        
        # 构建使用方法描述
        usage_desc = ""
        if req.usageMedia['type'] == 'video':
            usage_desc = f"使用方法视频：{req.usageMedia.get('videoUrl', '')}"
        elif req.usageMedia['type'] == 'images':
            usage_desc = f"使用方法图文说明：{len(req.usageMedia.get('imageUrls', []))}张图片"
        elif req.usageMedia['type'] == 'text':
            usage_desc = f"使用方法：{req.usageMedia.get('textDescription', '')}"
        
        # 构建AI Prompt
        prompt = f"""你是专业的短视频脚本创作导演。

商品信息：
- 商品名称：{req.productName}
- 商品图片：共{len(req.productImages)}张
- {usage_desc}

任务：根据商品信息和使用方法，创作一个10-15秒的产品展示短视频脚本。

要求：
1. 生成3-5个镜头，每个镜头对应一张商品图片（imageIndex: 0-4）
2. 每个镜头包含：时间、场景、动作、台词、情绪
3. 台词要口语化、自然，符合UGC风格
4. 情绪弧线：从“好奇/中性”到“满意/兴奋”
5. 结合使用方法说明，展示产品功能和使用场景

返回JSON格式：
{{
  "shots": [
    {{
      "time": "0-3s",
      "scene": "场景描述",
      "action": "人物/产品动作",
      "audio": "台词内容",
      "emotion": "情绪状态",
      "imageIndex": 0
    }},
    {{
      "time": "3-6s",
      "scene": "特写镜头",
      "action": "展示产品细节",
      "audio": "介绍功能特点",
      "emotion": "专注",
      "imageIndex": 1
    }}
  ]
}}

示例台词风格：
- “这款耳机轻巧便携，特别适合通勤使用”
- “配备Type-C快充接口，充电超方便”
- “音质清晰，降噪效果也很棒”

仅返回JSON，不要其他文字。"""
        
        system_prompt = """你是专业的短视频脚本创作导演，擅长：
1. UGC风格内容创作，口语化表达
2. 产品功能与使用场景结合
3. 镜头设计紧凑，节奏明快
4. 情绪起伏自然，吸引力强"""
        
        # 调用AI生成脚本
        ai_response = await chat_with_ai(
            prompt, 
            system_prompt, 
            image_url=req.productImages[0]  # 传入第一张图片作为参考
        )
        
        # 解析JSON
        import json
        import re
        
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if not json_match:
            raise HTTPException(status_code=500, detail="AI生成脚本失败，格式错误")
        
        result = json.loads(json_match.group())
        shots = result.get('shots', [])
        
        # 验证脚本数据
        if not shots:
            raise HTTPException(status_code=500, detail="生成的脚本为空")
        
        # 确保每个镜头都有imageIndex
        for i, shot in enumerate(shots):
            if 'imageIndex' not in shot or shot['imageIndex'] is None:
                shot['imageIndex'] = i % 5  # 默认循环使用图片
        
        return {
            "success": True,
            "shots": shots
        }
        
    except HTTPException as e:
        raise e
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI返回数据解析失败: {str(e)}")
    except Exception as e:
        print(f"脚本生成错误: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"生成脚本失败: {str(e)}")

@app.post("/understand-product")
async def understand_product(req: UnderstandProductRequest):
    """B 阶段：产品理解（多模态识图 + 结构化 JSON 输出）"""
    print("="*80)
    print("[VERSION CHECK] /understand-product endpoint called - VERSION: 2025-12-17-v3-sora2-optimized")
    print(f"[REQUEST] imageUrl: {req.imageUrl is not None}, imageBase64: {req.imageBase64 is not None}")
    print("="*80)
    try:
        img = req.imageBase64 or req.imageUrl
        print(f"[DEBUG] Image source selected: {'base64' if req.imageBase64 else 'url'}")
        # 系统提示词：严格 JSON 模板
        system_prompt = """你是产品图理解专家。请基于输入图片，输出严格 JSON：
{
  "productName": "产品名称",
  "productType": "类型英文或中文",
  "attributes": { "material": "材质?", "color": "主色?", "shape": "形态?" },
  "sizeOptions": [
    { "label": "💄 口红级 (10cm)", "value": "mini", "description": "约10cm" },
    { "label": "🥤 矿泉水瓶级 (30cm)", "value": "normal", "description": "约30cm" },
    { "label": "🍾 大酒瓶级 (50cm+)", "value": "large", "description": "约50cm+" }
  ],
  "negativePrompts": ["负面提示词1", "负面提示词2"]
}

negativePrompts 说明：生成视频时需要避免的特征，如：
- 对于方形产品：["rounded corners", "curved edges", "deformed"]
- 对于精细产品：["blurry details", "bad anatomy", "extra parts"]
- 通用：["distorted", "malformed", "low quality"]

仅返回上述 JSON，不要解释文字。"""
        user_prompt = "请识别产品并填充 JSON 字段。"
        ai_response = await chat_with_ai(user_prompt, system_prompt, image_url=img)
        print(f"[DEBUG] AI response received, length: {len(ai_response) if ai_response else 0}")
        print(f"[DEBUG] AI response content (first 500 chars): {ai_response[:500] if ai_response else 'None'}")
        import json, re
        
        # 尝试多种方式提取JSON
        json_match = re.search(r'\{[\s\S]*?\}(?=[^}]*$)', ai_response)  # 匹配最后一个完整的JSON对象
        if not json_match:
            # 尝试匹配第一个JSON对象
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', ai_response)
        if not json_match:
            print("[ERROR] No JSON found in AI response")
            print(f"[ERROR] Full AI response: {ai_response}")
            raise HTTPException(status_code=500, detail="产品理解失败，格式错误")
        result = json.loads(json_match.group())
        print(f"[DEBUG] Parsed JSON result: {result.get('productName', 'N/A')}")
        pu = ProductUnderstanding(
            productName=result.get("productName"),
            productType=result.get("productType"),
            attributes=result.get("attributes"),
            sizeOptions=[SizeOption(**so) for so in result.get("sizeOptions", [])] if result.get("sizeOptions") else None,
            negativePrompts=result.get("negativePrompts", ["deformed", "distorted", "malformed", "low quality"])  # 默认负面提示词
        )
        print("[SUCCESS] Product understanding completed successfully")
        return {
            "success": True,
            "projectUpdate": {
                "productUnderstanding": pu.model_dump()
            }
        }
    except Exception as e:
        print(f"[B阶段] 产品理解错误: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "projectUpdate": {
                "productUnderstanding": {
                    "productName": None,
                    "productType": None,
                    "attributes": {},
                    "sizeOptions": [
                        {"label": "💄 口红级 (10cm)", "value": "mini", "description": "约10cm"},
                        {"label": "🥤 矿泉水瓶级 (30cm)", "value": "normal", "description": "约30cm"},
                        {"label": "🍾 大酒瓶级 (50cm+)", "value": "large", "description": "约50cm+"}
                    ]
                }
            }
        }

@app.post("/analyze-market")
async def analyze_market(req: MarketAnalysisRequest):
    """C 阶段：市场定位分析"""
    try:
        context = req.productUnderstanding or {}
        system_prompt = """你是市场分析专家。输出严格 JSON：
{
  "market": "目标市场（如：中国/印尼/越南...）",
  "segments": ["核心细分人群1","核心细分人群2"],
  "persona": { "age": "GenZ/Millennial", "gender": "Female/Male/不限", "traits": ["真实","潮流"] }
}
仅返回上述 JSON。"""
        user_prompt = f"根据产品理解进行市场定位分析：{context}"
        ai_response = await chat_with_ai(user_prompt, system_prompt)
        import json, re
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if not json_match:
            raise HTTPException(status_code=500, detail="市场分析失败，格式错误")
        result = json.loads(json_match.group())
        return {"success": True, "projectUpdate": {"marketAnalysis": result}}
    except Exception as e:
        print(f"[C阶段] 市场分析错误: {e}")
        return {"success": False, "error": str(e), "projectUpdate": {"marketAnalysis": {}}}

@app.post("/generate-strategy")
async def generate_strategy(req: StrategyRequest):
    """D 阶段：创意策略生成"""
    try:
        pu = req.productUnderstanding or {}
        ma = req.marketAnalysis or {}
        system_prompt = """你是创意策略导演。输出严格 JSON：
{
  "keyMessage": "核心信息",
  "painReliefArc": ["痛点A","解决B","转折C","满意D"],
  "tone": "真实/精致/潮流/简约",
  "narrative": "叙事策略简述"
}
仅返回上述 JSON。"""
        user_prompt = f"基于产品与市场生成创意策略：{pu} {ma}"
        ai_response = await chat_with_ai(user_prompt, system_prompt)
        import json, re
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if not json_match:
            raise HTTPException(status_code=500, detail="策略生成失败，格式错误")
        result = json.loads(json_match.group())
        return {"success": True, "projectUpdate": {"creativeStrategy": result}}
    except Exception as e:
        print(f"[D阶段] 策略生成错误: {e}")
        return {"success": False, "error": str(e), "projectUpdate": {"creativeStrategy": {}}}

@app.post("/match-style")
async def match_style(req: MatchStyleRequest):
    """E 阶段：视觉风格匹配"""
    try:
        pu = req.productUnderstanding or {}
        ma = req.marketAnalysis or {}
        cs = req.creativeStrategy or {}
        system_prompt = """你是风格匹配专家。输出严格 JSON：
{
  "styleCandidates": [
    { "id": "authentic", "label": "真实", "pros": ["亲近UGC"], "cons": ["可能略显朴素"] },
    { "id": "delicate", "label": "精致", "pros": ["画面高级"], "cons": ["成本较高"] },
    { "id": "trendy", "label": "潮流", "pros": ["年轻化"], "cons": ["易过时"] }
  ]
}
仅返回上述 JSON。"""
        user_prompt = f"为创意策略匹配视觉风格候选：{pu} {ma} {cs}"
        ai_response = await chat_with_ai(user_prompt, system_prompt)
        import json, re
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if not json_match:
            raise HTTPException(status_code=500, detail="风格匹配失败，格式错误")
        result = json.loads(json_match.group())
        return {"success": True, "projectUpdate": {"styleCandidates": result.get("styleCandidates", [])}}
    except Exception as e:
        print(f"[E阶段] 风格匹配错误: {e}")
        return {"success": False, "error": str(e), "projectUpdate": {"styleCandidates": []}}

@app.post("/generate-scripts")
async def generate_scripts(req: GenerateScriptsRequest):
    """F 阶段：生成三套脚本"""
    try:
        pu = req.productUnderstanding or {}
        ma = req.marketAnalysis or {}
        cs = req.creativeStrategy or {}
        vs = req.visualStyle or {}
        system_prompt = """你是短视频编剧。输出严格 JSON（3 套 10s 脚本，每套若干分镜）：
{
  "scripts": [
    [ { "time": "0-3s", "scene": "...", "action": "...", "audio": "...", "emotion": "..." }, { "time": "3-6s", "...": "..." }, { "time": "6-10s", "...": "..." } ],
    [ ... ],
    [ ... ]
  ]
}
仅返回上述 JSON。"""
        user_prompt = f"基于上下文生成三套脚本：{pu} {ma} {cs} {vs}"
        ai_response = await chat_with_ai(user_prompt, system_prompt)
        import json, re
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if not json_match:
            raise HTTPException(status_code=500, detail="脚本生成失败，格式错误")
        result = json.loads(json_match.group())
        return {"success": True, "projectUpdate": {"scriptOptions": result.get("scripts", [])}}
    except Exception as e:
        print(f"[F阶段] 三脚本生成错误: {e}")
        return {"success": False, "error": str(e), "projectUpdate": {"scriptOptions": []}}


# ======================
# 4. 锁定物理属性（旧架构，保留兼容）
# ======================

@app.post("/lock-physics", response_model=ChatResponse)
async def lock_physics(req: LockPhysicsRequest):
    """
    锁定尺寸约束后，开始选角环节（PRD 1.2）
    动态生成问题，而非固定模板
    """
    now_id = str(int(time.time() * 1000))

    # 根据尺寸生成约束描述
    scale_constraints = {
        "mini": "miniature size, fits in palm, handheld object",
        "normal": "standard size, typical everyday object",
        "large": "large size, oversized object"
    }
    
    constraint_text = scale_constraints.get(req.scale, "standard size")
    
    # PRD 1.2: 开始选角 - 动态生成问题
    # 根据产品类型智能调整问法
    msg = Message(
        id=now_id,
        role="ai",
        content=f"尺寸已锁定为 [{req.scale}]。\n\n现在开始选角：这个视频主要面向哪个市场？主角什么风格？\n（例如：印尼年轻女生，真实风格 / 中国一线城市，时尚潮流）",
        type="text",
    )
    update = ProjectUpdate(
        scale=req.scale,
        constraints={"scale": constraint_text}
    )
    return ChatResponse(message=msg, projectUpdate=update)


# ======================
# 4. 生成视频（真实 AI）
# ======================

@app.post("/generate-video")
async def generate_video(req: GenerateVideoRequest):
    """
    调用 AI 视频生成服务（Sora）
    """
    try:
        # 调用 AI 视频生成
        result = await generate_video_with_ai(
            prompt=req.prompt,
            images=req.images,
            orientation=req.orientation,
            size=req.size,
            duration=req.duration,
            watermark=req.watermark,
            private=req.private
        )
        return result
    except Exception as e:
        print(f"视频生成错误: {e}")
        raise HTTPException(status_code=500, detail=f"视频生成失败: {str(e)}")


@app.post("/query-video-task")
async def query_video_task(req: VideoTaskRequest):
    """
    查询视频生成任务状态
    """
    if not VIDEO_API_KEY:
        raise HTTPException(status_code=400, detail="视频生成服务未配置")
    
    try:
        headers = {
            "Authorization": f"Bearer {VIDEO_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{VIDEO_BASE_URL}/v1/video/query",
            headers=headers,
            params={"id": req.task_id},
            timeout=10
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"查询任务失败: {response.text}"
            )
        
        result = response.json()
        return result
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
