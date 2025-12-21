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

# 导入prompt配置
from prompts import (
    CHARACTER_GENERATION_SYSTEM_PROMPT,
    get_character_generation_prompt,
    SCRIPT_GENERATION_SYSTEM_PROMPT,
    get_script_generation_prompt,
    AI_DIRECTOR_SYSTEM_PROMPT,
    FORM_BASED_SCRIPT_SYSTEM_PROMPT,
    get_form_based_script_prompt,
    IMAGE_BASED_SCRIPT_SYSTEM_PROMPT,
    get_image_based_script_prompt
)

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

VIDEO_MODEL_NAME = os.getenv("VIDEO_MODEL_NAME", "sora-2")
VIDEO_API_KEY = os.getenv("VIDEO_GENERATION_API_KEY")
VIDEO_BASE_URL = os.getenv("VIDEO_GENERATION_ENDPOINT", "https://yunwu.ai")

# Sora角色视频生成配置
CHARACTER_VIDEO_MODEL_NAME = os.getenv("CHARACTER_VIDEO_MODEL_NAME", "sora-2")
CHARACTER_VIDEO_API_KEY = os.getenv("CHARACTER_VIDEO_API_KEY")
CHARACTER_VIDEO_BASE_URL = os.getenv("CHARACTER_VIDEO_ENDPOINT", "https://yunwu.ai")


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
print("[SERVER INFO] Build Version: 2025-12-19-v4-character-support")
print("[SERVER INFO] 核心功能：")
print("  - 脚本生成：使用Sora 2标准模板结构")
print("  - 视频生成：添加产品材质和几何描述")
print("  - 角色创建：支持sora-2-characters模型")
print("[SERVER INFO] API Endpoints: /upload-image, /generate-script, /generate-video, /query-video-task, /create-character")
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
    type: Optional[str] = None  # 'text' | 'script_review'
    chips: Optional[List[Chip]] = None


class ProjectUpdate(BaseModel):
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


# 已移除尺寸锁定相关的数据模型


class GenerateVideoRequest(BaseModel):
    prompt: str
    images: Optional[List[str]] = []  # 图片URL列表
    orientation: Optional[str] = "portrait"  # portrait 竖屏, landscape 横屏
    size: Optional[str] = "large"  # small (720p) 或 large
    duration: Optional[int] = 10  # 视频时长，支持10秒
    watermark: Optional[bool] = False  # 是否有水印
    private: Optional[bool] = True  # 是否隐藏视频
    character_id: Optional[str] = None  # 新增：角色ID，如果传入则使用带角色的视频生成接口


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
    usageMethod: str  # 使用方式（如"喷雾"、"佩戴"）
    sellingPoints: List[str]  # 核心卖点
    language: str  # 语言（zh-CN, en-US, id-ID, vi-VN）
    duration: int  # 时长（15或25）

class GenerateCharacterRequest(BaseModel):
    """使用AI生成角色信息请求"""
    model: Optional[str] = "gpt-4"
    prompt: Optional[str] = None
    country: Optional[str] = None  # 新增：国家
    ethnicity: Optional[str] = None  # 新增：人种
    age: Optional[int] = None  # 新增：年龄
    gender: Optional[str] = None  # 新增：性别

class GenerateScriptAIRequest(BaseModel):
    """使用ChatGPT生成脚本请求（新的4阶段工作流）"""
    productName: str
    category: str
    usage: str
    sellingPoints: str
    country: str
    language: str
    duration: str  # "15s" 或 "25s"
    style: Optional[str] = None  # 新增：视频风格
    characterName: Optional[str] = None  # 角色名称
    characterDescription: Optional[str] = None  # 角色描述

# 已移除产品理解相关的数据模型 - 不再需要视觉识别功能

# 已移除复杂的多阶段分析相关的数据模型


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

async def chat_with_ai(prompt: str, system_prompt: Optional[str] = None, image_url: Optional[str] = None, history: Optional[List[dict]] = None) -> str:
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
                    base64_image = ""  # 设置为空字符串而非None
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


async def generate_video_with_ai(prompt: str, images: Optional[List[str]] = None, orientation: Optional[str] = "portrait", 
                                size: Optional[str] = "large", duration: Optional[int] = 15, watermark: bool = False, 
                                private: bool = True, product_attributes: Optional[dict] = None, negative_prompts: Optional[List[str]] = None, character_id: Optional[str] = None) -> dict:
    """
    使用 Sora API 生成视频（云雾 API）
    PRD Phase 4: Prompt Assembly - 整合所有约束生成最终Prompt
    
    根据Sora 2教程优化：
    1. 强调产品的结构和材质（geometric, solid, sturdy, clean lines, professional product shot）
    2. 添加负面提示词避免变形（deformed, distorted, malformed, bad anatomy）
    3. 使用专业摄影术语（low-angle shot, shallow depth of field）
    4. 支持角色：如果传入character_id，则使用带Character的视频生成接口
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
        
        # 构建请求数据（符合云雾 Sora API 规范）
        # API文档：https://yunwu.apifox.cn/api-358068907.md
        payload = {
            "model": VIDEO_MODEL_NAME,  # sora-2 或 sora-2-pro
            "prompt": enhanced_prompt,  # 使用增强后的Prompt
            "images": images if images else [],
            "orientation": orientation,  # portrait 或 landscape
            "size": size,  # small 或 large
            "duration": 15,  # 固定使用15秒（API要求）
            "watermark": watermark  # 布尔值格式（修复：从字符串改为布尔值）
        }
        
        # 根据是否有角色ID添加参数
        if character_id:
            payload["character_id"] = character_id
            print(f"[VIDEO GENERATION] 使用角色生成视频，character_id: {character_id}")
            # 云雾API文档：https://yunwu.apifox.cn/api-369666077.md
        
        # 统一使用 /v1/video/create 端点（无论是否有角色）
        api_endpoint = f"{VIDEO_BASE_URL}/v1/video/create"
        # 云雾API文档：
        # - 普通视频：https://yunwu.apifox.cn/api-358068907.md
        # - 带角色：https://yunwu.apifox.cn/api-369666077.md
        
        print(f"[VIDEO GENERATION] Enhanced Prompt: {enhanced_prompt[:200]}...")  # 打印前200个字符
        print(f"[VIDEO GENERATION] API Endpoint: {api_endpoint}")
        if character_id:
            print(f"[VIDEO GENERATION] Character ID: {character_id}")
        
        # 调用创建视频任务接口（云雾 API - 统一视频格式）
        # 参考文档：https://yunwu.apifox.cn/api-358068907.md (普通)
        # 或 https://yunwu.apifox.cn/api-369666077.md (带Character)
        response = requests.post(
            api_endpoint,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"API 请求失败: {response.status_code} - {response.text}")
        
        result = response.json()
        
        print(f"[VIDEO GENERATION] API返回: {result}")
        
        # 根据实际 API 响应结构提取数据
        # 情兵1：直接返回结果（同步模式）
        if "url" in result or "video_url" in result:
            video_url = result.get("video_url") or result.get("url")
            print(f"[VIDEO GENERATION] ✅ 视频立即生成完成: {video_url}")
            return {
                "url": video_url,
                "thumbnail": result.get("thumbnail"),
                "status": "completed",
                "enhanced_prompt": result.get("enhanced_prompt")
            }
        
        # 情兵2：返回任务ID（异步模式）- 立即返回，不要轮询
        elif "id" in result or "task_id" in result:
            task_id = result.get("id") or result.get("task_id")
            print(f"[VIDEO GENERATION] 🔄 异步任务创建成功: {task_id}")
            return {
                "status": "processing",
                "task_id": task_id,
                "message": "视频生成中，请稍后查询任务状态"
            }
        
        # 情兵3：未知响应格式
        else:
            print(f"[VIDEO GENERATION] ⚠️ 未知响应格式: {result}")
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
    火山云 TOS 访问格式：https://<bucket>.tos-<region>.volces.com/<key>
    例如：https://sora-2.tos-cn-beijing.volces.com/uploads/...
    """
    # endpoint已经是 tos-cn-beijing.volces.com 格式
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
@app.post("/api/upload-image")  # 兼容前端调用
async def upload_image(file: UploadFile = File(...)):
    # 支持图片和视频上传
    allowed_types = ["image/", "video/"]
    if not file.content_type or not any(file.content_type.startswith(t) for t in allowed_types):
        raise HTTPException(status_code=400, detail="只允许上传图片或视频文件")

    # 生成唯一文件名
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    key = f"uploads/{time.strftime('%Y%m%d')}/{int(time.time()*1000)}-{uuid.uuid4().hex}{ext}"

    print(f"[Upload] 开始上传: {file.filename}")
    print(f"[Upload] Content-Type: {file.content_type}")
    print(f"[Upload] Bucket: {TOS_BUCKET}")
    print(f"[Upload] Key: {key}")
    print(f"[Upload] Endpoint: {TOS_ENDPOINT}")
    print(f"[Upload] Region: {TOS_REGION}")
    print(f"[Upload] AK: {TOS_ACCESS_KEY[:10] if TOS_ACCESS_KEY else 'None'}...")

    try:
        # 读取文件内容
        content = await file.read()
        file_size = len(content)
        print(f"[Upload] 文件大小: {file_size} bytes ({file_size/1024:.2f} KB)")
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="文件为空")
        
        # 使用TOS SDK上传（Virtual-Host模式）
        print(f"[Upload] 调用TOS SDK put_object...")
        print(f"[Upload] 将上传 {file_size} 字节的数据")
        
        # 使用BytesIO包装以确保完整传输
        from io import BytesIO
        result = tos_client.put_object(
            bucket=TOS_BUCKET,
            key=key,
            content=BytesIO(content),  # 使用BytesIO包装
            content_length=file_size,   # 明确指定长度
            content_type=file.content_type
        )
        
        print(f"[Upload] ✅ 上传成功!")
        print(f"[Upload] RequestID: {result.request_id}")
        print(f"[Upload] ETag: {result.etag if hasattr(result, 'etag') else 'N/A'}")
        
    except tos.exceptions.TosServerError as e:
        print(f"[Upload Error] ❌ TOS服务器错误")
        print("="*80)
        print(f"Status Code: {e.status_code}")
        print(f"RequestID: {e.request_id}")
        print(f"Code: {e.code}")
        print(f"Message: {e.message}")
        print(f"HostID: {e.host_id}")
        print("="*80)
        raise HTTPException(status_code=500, detail=f"上传失败: {e.message}")
        
    except tos.exceptions.TosClientError as e:
        print(f"[Upload Error] ❌ TOS客户端错误: {e.message}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"上传失败: {e.message}")
        
    except Exception as e:
        print(f"[Upload Error] ❌ 未知错误: {type(e).__name__}")
        print(f"[Upload Error] 错误详情: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")

    # 构建Virtual-Host访问URL
    url = build_public_url(TOS_BUCKET, key)
    print(f"[Upload] 返回URL: {url}")
    print(f"[Upload] Virtual-Host格式: {TOS_BUCKET}.{TOS_ENDPOINT.replace('https://', '')}")
    print(f"[Upload] 完成！文件大小: {file_size} bytes")
    print("="*80)
    
    return {"url": url, "size": file_size}


# ======================
# 2. AI 聊天接口
# ======================

@app.post("/chat", response_model=ChatResponse)
async def send_chat(req: ChatRequest):
    content = req.content
    lower = content.lower()
    now_id = str(int(time.time() * 1000))
    
    # 使用配置的AI导演助手prompt
    system_prompt = AI_DIRECTOR_SYSTEM_PROMPT
    
    # 直接进行自然对话，不再需要视觉识别和尺寸选择
    
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
        
        # 使用prompt配置文件生成prompt
        product_info_dict = {
            'productName': info.productName,
            'size': info.size,
            'weight': info.weight,
            'sellingPoints': info.sellingPoints,
            'targetMarket': info.targetMarket,
            'ageGroup': info.ageGroup,
            'gender': info.gender,
            'style': info.style
        }
        
        prompt = get_form_based_script_prompt(product_info_dict, req.imageUrl)
        
        # 调用AI生成脚本
        ai_response = await chat_with_ai(prompt, FORM_BASED_SCRIPT_SYSTEM_PROMPT, image_url=req.imageUrl)
        
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
    新业务流程：根据5张商品图片+使用方法+卖点生成视频脚本
    适配新的4阶段工作流程
    """
    try:
        # 验证输入
        if len(req.productImages) != 5:
            raise HTTPException(status_code=400, detail="必须提供恰好5张商品图片")
        
        if not req.productName or not req.usageMethod:
            raise HTTPException(status_code=400, detail="商品名称和使用方式不能为空")
        
        if not req.sellingPoints or len(req.sellingPoints) == 0:
            raise HTTPException(status_code=400, detail="必须提供至少一个核心卖点")
        
        # 根据语言设置提示词
        language_map = {
            'zh-CN': '中文',
            'en-US': '英文',
            'id-ID': '印尼语',
            'vi-VN': '越南语',
        }
        target_language = language_map.get(req.language, '中文')
        
        # 使用prompt配置文件生成prompt
        prompt = get_image_based_script_prompt(
            product_name=req.productName,
            usage_method=req.usageMethod,
            selling_points=req.sellingPoints,
            language=target_language,
            duration=req.duration,
            num_images=len(req.productImages)
        )
        
        # 调用AI生成脚本
        ai_response = await chat_with_ai(
            prompt, 
            IMAGE_BASED_SCRIPT_SYSTEM_PROMPT, 
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

# 已移除 /understand-product 端点 - 不再需要视觉识别功能

# 已移除复杂的多阶段分析接口 - 简化为直接的脚本生成流程


# ======================
# 4. 锁定物理属性（旧架构，保留兼容）
# ======================

# 已移除 /lock-physics 端点 - 不再需要尺寸约束功能


# ======================
# 4. 生成视频（真实 AI）
# ======================

@app.post("/generate-video")
@app.post("/api/generate-video")  # 兼容前端调用
async def generate_video(req: GenerateVideoRequest):
    """
    调用 AI 视频生成服务（Sora）
    支持角色：如果传入character_id，则使用带Character的视频生成API
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
            private=req.private,
            character_id=req.character_id  # 新增：传递角色ID
        )
        return result
    except Exception as e:
        print(f"视频生成错误: {e}")
        raise HTTPException(status_code=500, detail=f"视频生成失败: {str(e)}")


@app.post("/query-video-task")
async def query_video_task(req: VideoTaskRequest):
    """
    查询视频生成任务状态（POST版本，保留兼容）
    云雾API文档：https://yunwu.apifox.cn/api-358068905.md
    """
    if not VIDEO_API_KEY:
        raise HTTPException(status_code=400, detail="视频生成服务未配置")
    
    try:
        headers = {
            "Authorization": f"Bearer {VIDEO_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # 使用统一视频格式的查询endpoint
        response = requests.get(
            f"{VIDEO_BASE_URL}/v1/video/generations/{req.task_id}",
            headers=headers,
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


@app.get("/api/video-task/{task_id}")
@app.get("/video-task/{task_id}")
async def query_video_task_get(task_id: str):
    """
    查询视频生成任务状态（GET版本，前端使用）
    云雾API文档：https://yunwu.apifox.cn/api-358068905.md
    路径参数：task_id - 任务ID
    """
    if not VIDEO_API_KEY:
        raise HTTPException(status_code=400, detail="视频生成服务未配置")
    
    try:
        print(f"[查询任务] Task ID: {task_id}")
        
        headers = {
            "Authorization": f"Bearer {VIDEO_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # 使用统一视频格式的查询endpoint
        response = requests.get(
            f"{VIDEO_BASE_URL}/v1/video/generations/{task_id}",
            headers=headers,
            timeout=10
        )
        
        print(f"[查询任务] 云雾API响应状态码: {response.status_code}")
        
        if response.status_code != 200:
            print(f"[查询任务] 云雾API错误: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"查询任务失败: {response.text}"
            )
        
        result = response.json()
        print(f"[查询任务] 返回数据: status={result.get('status')}, progress={result.get('progress')}")
        return result
        
    except requests.RequestException as e:
        print(f"[查询任务] 请求异常: {str(e)}")
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}")


@app.post("/api/generate-character")
async def generate_character(req: GenerateCharacterRequest):
    """
    使用AI生成角色信息
    使用配置的LLM模型（ChatGPT/Gemini等）
    """
    print("="*80)
    print("[API] /api/generate-character 收到请求")
    print(f"[请求数据] model: {req.model}")
    print(f"[请求数据] country: {req.country}")
    print(f"[请求数据] ethnicity: {req.ethnicity}")
    print(f"[请求数据] age: {req.age}")
    print(f"[请求数据] gender: {req.gender}")
    print("="*80)
    
    if not ai_client:
        print("[错误] AI服务未配置")
        raise HTTPException(status_code=400, detail="AI服务未配置")
    
    # 使用prompt配置文件生成prompt（如果前端传了就用前端的）
    prompt = req.prompt or get_character_generation_prompt(
        country=req.country,
        ethnicity=req.ethnicity,
        age=req.age,
        gender=req.gender
    )
    
    try:
        print(f"[AI调用] 开始调用AI，模型: {LLM_MODEL_NAME}")
        response = ai_client.chat.completions.create(
            model=LLM_MODEL_NAME,
            messages=[
                {"role": "system", "content": CHARACTER_GENERATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=500
        )
        
        content = response.choices[0].message.content.strip()
        print(f"[AI响应] 原始内容长度: {len(content)}")
        print(f"[AI响应] 内容预览: {content[:300]}...")
        
        # 解析JSON（去除可能的markdown代码块）
        import json
        import re
        json_match = re.search(r'```(?:json)?\s*({[^`]+})\s*```', content)
        if json_match:
            json_str = json_match.group(1)
            print("[解析] 从markdown代码块中提取JSON")
        else:
            json_str = content
            print("[解析] 直接解析内容")
        
        character_data = json.loads(json_str)
        print(f"[成功] 解析角色数据: {json.dumps(character_data, ensure_ascii=False)}")
        print("="*80)
        return character_data
        
    except Exception as e:
        print(f"[AI生成角色错误] {str(e)}")
        import traceback
        traceback.print_exc()
        print("="*80)
        raise HTTPException(status_code=500, detail=f"生成角色失败: {str(e)}")


@app.post("/api/generate-script-ai")
async def generate_script_ai(req: GenerateScriptAIRequest):
    """
    使用ChatGPT生成视频脚本（新4阶段工作流程）
    根据商品信息、角色、视频配置生成完整的视频脚本
    """
    if not ai_client:
        raise HTTPException(status_code=400, detail="AI服务未配置")
    
    try:
        # 语言映射（支持前端的所有语言代码）
        language_map = {
            'zh-CN': '中文',
            'zh': '中文',
            'en-US': '英语',
            'en': '英语',
            'de': '德语',
            'es': '西班牙语',
            'th': '泰语',
            'vi-VN': '越南语',
            'vi': '越南语',
            'ja': '日语',
            'fil': '菲律宾语',
            'ms': '马来语',
            'id-ID': '印尼语',
            'id': '印尼语',
        }
        target_language = language_map.get(req.language, req.language)  # 如果找不到，就直接使用原值
        
        print(f"[脚本生成] 请求语言代码: {req.language}")
        print(f"[脚本生成] 映射后语言: {target_language}")
        
        # 解析时长
        duration_seconds = int(req.duration.replace('s', ''))
        
        # 使用prompt配置文件生成prompt
        prompt = get_script_generation_prompt(
            product_name=req.productName,
            category=req.category,
            usage=req.usage,
            selling_points=req.sellingPoints,
            country=req.country,
            language=target_language,
            duration=duration_seconds,
            character_name=req.characterName,
            character_description=req.characterDescription,
            style=req.style
        )
        
        # 调用AI生成脚本
        response = ai_client.chat.completions.create(
            model=LLM_MODEL_NAME,
            messages=[
                {"role": "system", "content": SCRIPT_GENERATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        print(f"[AI生成脚本] 原始响应: {content[:200]}...")
        
        # 解析JSON
        import json
        import re
        json_match = re.search(r'```(?:json)?\s*({[\s\S]+?})\s*```', content)
        if json_match:
            json_str = json_match.group(1)
        else:
            # 尝试直接解析
            json_str = content
        
        result = json.loads(json_str)
        shots = result.get('shots', [])
        
        # 验证脚本数据
        if not shots:
            raise HTTPException(status_code=500, detail="生成的脚本为空")
        
        return {
            "success": True,
            "shots": shots
        }
        
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
        print(f"原始内容: {content}")
        raise HTTPException(status_code=500, detail=f"AI返回数据解析失败: {str(e)}")
    except Exception as e:
        print(f"脚本生成错误: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"生成脚本失败: {str(e)}")


class CreateCharacterRequest(BaseModel):
    """创建角色请求"""
    name: str
    description: str
    age: Optional[int] = None
    gender: Optional[str] = None
    style: Optional[str] = None
    tags: Optional[List[str]] = None


@app.post("/create-character")
async def create_character(req: CreateCharacterRequest):
    """
    创建角色（本地存储，不调用云雾API）
    前端会把角色信息保存到本地store
    """
    try:
        import uuid
        
        # 生成本地角色ID
        character_id = f"char_{uuid.uuid4().hex[:12]}"
        
        print(f"[创建角色] 角色名称: {req.name}")
        print(f"[创建角色] 角色ID: {character_id}")
        print(f"[创建角色] 描述长度: {len(req.description)} 字")
        
        # 返回成功响应
        return {
            "success": True,
            "character_id": character_id,
            "data": {
                "id": character_id,
                "name": req.name,
                "description": req.description,
                "age": req.age,
                "gender": req.gender,
                "style": req.style,
                "tags": req.tags
            }
        }
        
    except Exception as e:
        print(f"[创建角色错误] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"创建角色失败: {str(e)}")


# ======================
# 管理员 API
# ======================

# 模拟数据库（实际应用中应该使用真实数据库）
ADMIN_USERS = {"admin@soradirector.com"}  # 管理员邮箱列表
all_users_db = []  # 所有用户
all_videos_db = []  # 所有视频
all_prompts_db = []  # 所有提示词

@app.get("/api/public-videos")
async def get_public_videos():
    """
    获取所有公开的视频（内容广场）
    """
    try:
        public_videos = [v for v in all_videos_db if v.get('isPublic', False)]
        return {"videos": public_videos}
    except Exception as e:
        print(f"获取公开视频失败: {e}")
        return {"videos": []}

@app.get("/api/admin/stats")
async def get_admin_stats():
    """
    获取管理员统计数据
    """
    try:
        total_credits_used = sum(user.get('creditsUsed', 0) for user in all_users_db)
        return {
            "totalUsers": len(all_users_db),
            "totalVideos": len(all_videos_db),
            "publicVideos": len([v for v in all_videos_db if v.get('isPublic', False)]),
            "totalCreditsUsed": total_credits_used
        }
    except Exception as e:
        print(f"获取统计数据失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/users")
async def get_all_users():
    """
    获取所有用户列表
    """
    try:
        return {"users": all_users_db}
    except Exception as e:
        print(f"获取用户列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/videos")
async def get_all_videos():
    """
    获取所有视频（包括未公开的）
    """
    try:
        return {"videos": all_videos_db}
    except Exception as e:
        print(f"获取视频列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/prompts")
async def get_all_prompts():
    """
    获取所有提示词
    """
    try:
        return {"prompts": all_prompts_db}
    except Exception as e:
        print(f"获取提示词列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/video/{video_id}/public")
async def toggle_video_public(video_id: str, isPublic: bool = True):
    """
    切换视频的公开状态
    """
    try:
        for video in all_videos_db:
            if video['id'] == video_id:
                video['isPublic'] = isPublic
                return {"success": True}
        raise HTTPException(status_code=404, detail="视频不存在")
    except Exception as e:
        print(f"切换视频公开状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/video/{video_id}")
async def delete_video_admin(video_id: str):
    """
    删除视频
    """
    try:
        global all_videos_db
        all_videos_db = [v for v in all_videos_db if v['id'] != video_id]
        return {"success": True}
    except Exception as e:
        print(f"删除视频失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/user/{user_id}/credits")
async def update_user_credits(user_id: str, credits: int):
    """
    更新用户积分
    """
    try:
        for user in all_users_db:
            if user['id'] == user_id:
                user['credits'] = credits
                return {"success": True}
        raise HTTPException(status_code=404, detail="用户不存在")
    except Exception as e:
        print(f"更新用户积分失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
