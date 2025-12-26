from __future__ import annotations

import os
import time
import uuid
import json
import asyncio
import requests
import base64
import bcrypt  # 新增：密码加密
from typing import Any, List, Optional
from io import BytesIO
from datetime import datetime

import boto3
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.openapi.docs import get_swagger_ui_html
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# 导入数据库模块
from database import (
    get_db, test_connection, init_database,
    User, Product, Project, Video, Character, SavedPrompt, CreditHistory, GeneratedImage
)

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

# 导入微信支付模块
from wechat_pay import create_native_order, verify_callback_signature, query_order, decrypt_callback_resource

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

# ✅ API令牌池：从环境变量读取，失败自动切换
api_key_pool_str = os.getenv("API_KEY_POOL", "")
API_KEY_POOL = [key.strip() for key in api_key_pool_str.split(",") if key.strip()]  # 用逗号分隔
current_api_key_index = 0  # 当前API Key索引

print(f"[API Pool] 加载了 {len(API_KEY_POOL)} 个API令牌")

def get_next_api_key():
    """
    获取下一个API Key，实现轮询机制
    """
    global current_api_key_index
    if not API_KEY_POOL:
        return VIDEO_API_KEY  # 如果没有配置API_KEY_POOL，返回默认的VIDEO_API_KEY
    
    api_key = API_KEY_POOL[current_api_key_index]
    current_api_key_index = (current_api_key_index + 1) % len(API_KEY_POOL)
    return api_key

def get_current_api_key():
    """
    获取当前API Key（不切换）
    """
    if not API_KEY_POOL:
        return VIDEO_API_KEY  # 如果没有配置API_KEY_POOL，返回默认的VIDEO_API_KEY
    return API_KEY_POOL[current_api_key_index]

# Sora角色视频生成配置
CHARACTER_VIDEO_MODEL_NAME = os.getenv("CHARACTER_VIDEO_MODEL_NAME", "sora-2")
CHARACTER_VIDEO_API_KEY = os.getenv("CHARACTER_VIDEO_API_KEY")
CHARACTER_VIDEO_BASE_URL = os.getenv("CHARACTER_VIDEO_ENDPOINT", "https://yunwu.ai")

# NanoBanana 生图模型配置
IMAGE_GEN_MODEL_NAME = os.getenv("IMAGE_GEN_MODEL_NAME", "gemini-3-pro-image-preview")
IMAGE_GEN_API_KEY = os.getenv("IMAGE_GEN_API_KEY")
IMAGE_GEN_BASE_URL = os.getenv("IMAGE_GEN_BASE_URL", "https://yunwu.ai")


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

# 数据库启动事件
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    print("\n" + "="*80)
    print("[DATABASE] 正在初始化数据库连接...")
    print("="*80)
    
    if test_connection():
        print("[DATABASE] [OK] 数据库连接成功！")
        print("[DATABASE] 数据将保存到 PostgreSQL")
    else:
        print("[DATABASE] [ERROR] 数据库连接失败！")
        print("[DATABASE] 应用将继续运行，但数据不会持久化")
    
    print("="*80 + "\n")
    yield
    # 关闭时执行
    print("[DATABASE] 关闭数据库连接...")

app = FastAPI(title="SoraDirector Backend", version="0.1.0", docs_url=None, redoc_url=None, openapi_url="/openapi.json", lifespan=lifespan)

# CORS：开发阶段先全放开
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加Pydantic验证错误处理
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("="*80)
    print("[❗ 422错误] Pydantic验证失败:")
    print(f"  请求路径: {request.url.path}")
    print(f"  请求方法: {request.method}")
    print(f"  错误详情:")
    for error in exc.errors():
        print(f"    - 字段: {error['loc']}")
        print(f"      类型: {error['type']}")
        print(f"      消息: {error['msg']}")
        if 'input' in error:
            print(f"      输入值: {error['input']}")
    print("="*80)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)}
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

# ======================
# 密码加密工具函数
# ======================

def hash_password(password: str) -> str:
    """
    使用 bcrypt 加密密码
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码是否正确
    """
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"[密码验证错误] {str(e)}")
        return False


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
        
        # 构建请求数据（符合云雾API规范）
        # API文档：https://yunwu.apifox.cn/api-358068907.md
        # 使用前端传来的size参数（small或large）
        payload = {
            "model": VIDEO_MODEL_NAME,  # sora-2 或 sora-2-pro
            "prompt": enhanced_prompt,  # 使用增强后的Prompt
            "images": images if images else [],
            "orientation": orientation,  # portrait 或 landscape
            "size": size,  # 使用前端传来的size（small或large）
            "duration": duration,  # ✅ 使用前端传入的duration（15或25）
            "watermark": watermark,  # 布尔值
            "private": private  # 布尔值 - 重要！必须传递
        }
        
        print(f"[VIDEO GENERATION] 前端传入size: {size}, 实际使用: {size}")
        
        # 根据是否有角色ID添加参数
        # 注意：带角色的API使用 character_url 和 character_timestamps，不是character_id
        # 目前暂不支持带角色生成，所以注释掉
        # if character_id:
        #     payload["character_url"] = character_url
        #     payload["character_timestamps"] = "1,3"  # 默认使用1-3秒
        #     print(f"[VIDEO GENERATION] 使用角色生成视频")
        
        # 统一使用 /v1/video/create 端点（无论是否有角色）
        api_endpoint = f"{VIDEO_BASE_URL}/v1/video/create"
        # 云雾API文档：
        # - 普通视频：https://yunwu.apifox.cn/api-358068907.md
        # - 带角色：https://yunwu.apifox.cn/api-369666077.md
        
        print(f"[VIDEO GENERATION] Enhanced Prompt: {enhanced_prompt[:200]}...")  # 打印前200个字符
        print(f"[VIDEO GENERATION] API Endpoint: {api_endpoint}")
        print(f"[VIDEO GENERATION] Payload: {payload}")  # 打印完整payload用于调试
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
# 1.5 图片拼接接口
# ======================

class CombineImagesRequest(BaseModel):
    """图片拼接请求"""
    imageUrls: List[str]  # 图片URL列表（2-9张）

class GenerateNineGridRequest(BaseModel):
    """生成九宫格图片请求"""
    imageUrl: str  # 原始图片URL（白底图）
    user_id: str  # 用户ID，用于扣除积分

from PIL import Image
import math

@app.post("/api/combine-images")
async def combine_images(req: CombineImagesRequest):
    """
    将多张图片拼接成宫格图（2-4张→2x2，5-9张→3x3）
    解决前端Canvas跨域问题，在后端完成图片拼接
    """
    image_count = len(req.imageUrls)
    
    # 1张图不需要拼接
    if image_count == 1:
        print('[拼接] 只有1张图片，无需拼接')
        return {"gridUrl": req.imageUrls[0], "originalUrls": req.imageUrls}
    
    if image_count > 9:
        raise HTTPException(status_code=400, detail="最多支持9张图片")
    
    # 2-4张 → 2x2宫格，5-9张 → 3x3宫格
    grid_size = 2 if image_count <= 4 else 3
    max_images = grid_size * grid_size
    
    print(f"[拼接] 开始拼接 {image_count} 张图片为 {grid_size}x{grid_size} 宫格...")
    
    try:
        # 下载所有图片
        images = []
        for url in req.imageUrls:
            print(f"[拼接] 下载图片: {url}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            images.append(img)
        
        print('[拼接] 所有图片下载完成')
        
        # 创建画布
        cell_width = 400
        cell_height = 400
        canvas_width = cell_width * grid_size
        canvas_height = cell_height * grid_size
        
        # 创建白色背景
        canvas = Image.new('RGB', (canvas_width, canvas_height), (255, 255, 255))
        
        # 绘制图片
        for i in range(min(image_count, max_images)):
            row = i // grid_size
            col = i % grid_size
            x = col * cell_width
            y = row * cell_height
            
            # 调整图片大小以适应单元格（保持比例，裁剪填充）
            img = images[i]
            scale = max(cell_width / img.width, cell_height / img.height)
            scaled_width = int(img.width * scale)
            scaled_height = int(img.height * scale)
            img_resized = img.resize((scaled_width, scaled_height), Image.Resampling.LANCZOS)
            
            # 居中裁剪
            offset_x = (scaled_width - cell_width) // 2
            offset_y = (scaled_height - cell_height) // 2
            img_cropped = img_resized.crop((offset_x, offset_y, offset_x + cell_width, offset_y + cell_height))
            
            # 粘贴到画布
            canvas.paste(img_cropped, (x, y))
            print(f"[拼接] 绘制第{i + 1}张图片: 位置({row}, {col})")
        
        print('[拼接] 所有图片绘制完成，开始压缩...')
        
        # 保存为JPEG（压缩）
        output = BytesIO()
        canvas.save(output, format='JPEG', quality=85)
        output.seek(0)
        
        file_size = len(output.getvalue())
        print(f"[拼接] 拼接完成，大小: {file_size / 1024:.2f} KB")
        
        # 上传到TOS
        ext = ".jpg"
        key = f"uploads/{time.strftime('%Y%m%d')}/{int(time.time()*1000)}-grid-{grid_size}x{grid_size}{ext}"
        
        print(f"[拼接] 开始上传到TOS: {key}")
        result = tos_client.put_object(
            bucket=TOS_BUCKET,
            key=key,
            content=output,
            content_length=file_size,
            content_type="image/jpeg"
        )
        
        grid_url = build_public_url(TOS_BUCKET, key)
        print(f"[拼接] 上传成功: {grid_url}")
        
        # 删除原图
        print(f"[清理] 开始从桶中删除 {len(req.imageUrls)} 张原图...")
        for url in req.imageUrls:
            try:
                # 从 URL提取对象键
                parts = url.split('.com/')
                if len(parts) >= 2:
                    object_key = parts[1]
                    tos_client.delete_object(bucket=TOS_BUCKET, key=object_key)
                    print(f"[清理] ✅ 删除成功: {object_key}")
            except Exception as e:
                print(f"[清理] ⚠️ 删除失败: {url}, 错误: {str(e)}")
        
        print(f"✅ {grid_size}x{grid_size}宫格拼接并上传成功！")
        
        return {
            "gridUrl": grid_url,
            "gridSize": f"{grid_size}x{grid_size}",
            "originalUrls": req.imageUrls
        }
        
    except requests.RequestException as e:
        print(f"[拼接] 下载图片失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"下载图片失败: {str(e)}")
    except Exception as e:
        print(f"[拼接] 拼接失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"图片拼接失败: {str(e)}")


# ======================
# 1.6 NanoBanana九宫格图片生成
# ======================

@app.post("/api/generate-nine-grid")
async def generate_nine_grid(req: GenerateNineGridRequest, db: Session = Depends(get_db)):
    """
    使用Gemini gemini-3-pro-image-preview生成九宫格图片
    输入：一张白底图
    输出：一张包含9个视角的2K高清九宫格图片
    消耗：50积分
    """
    if not IMAGE_GEN_API_KEY:
        raise HTTPException(status_code=500, detail="生图模型未配置")
    
    # 1. 先检查积分是否足够
    CREDITS_COST = 50  # 生成九宫格图片消耇50积分
    
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    if user.credits < CREDITS_COST:
        raise HTTPException(
            status_code=400,
            detail=f"积分不足！当前积分：{user.credits}，需要：{CREDITS_COST}"
        )
    
    print(f"[九宫格] 开始生成九宫格图片...")
    print(f"[九宫格] 用户ID: {req.user_id}, 当前积分: {user.credits}")
    print(f"[九宫格] 原始图片: {req.imageUrl}")
    
    try:
        # 下载原始图片并转换为base64
        print(f"[九宫格] 下载原始图片...")
        img_response = requests.get(req.imageUrl, timeout=30)
        img_response.raise_for_status()
        
        # 转换为base64
        import base64
        import json
        image_base64 = base64.b64encode(img_response.content).decode('utf-8')
        
        # 构造Gemini原生格式的请求
        prompt = f"""请为这个商品生成一张包含9个不同角度视图的3x3九宫格产品展示图片。

要求：
1. 图片尺寸：1920x1920像素（2K高清）
2. 3x3网格布局，共9个视角：
   - 第1行：左侧视角、顶部俯视图、右侧视角
   - 第2行：左前45度角、正面视角、右前45度角
   - 第3行：左后45度角、底部视图、右后45度角
3. 所有视角都展示同一个产品
4. 保持白色或浅灰色简洁背景
5. 每个视角的产品大小、光照、材质保持一致
6. 每个小格尺寸相同，排列整齐
7. 不要添加任何文字、标注、细节特写或使用场景
8. 纯产品多角度展示，就像电商产品图

请生成一张完整的3x3宫格图片，不要分开生成。"""
        
        print(f"[九宫格] 调用Gemini API...")
        print(f"[九宫格] 模型: {IMAGE_GEN_MODEL_NAME}")
        print(f"[九宫格] Base URL: {IMAGE_GEN_BASE_URL}")
        
        # 根据API文档，使用正确的调用格式
        api_url = f"{IMAGE_GEN_BASE_URL}/v1beta/models/{IMAGE_GEN_MODEL_NAME}:generateContent"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # 根据API文档，使用查询参数传递key
        params = {
            "key": IMAGE_GEN_API_KEY
        }
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": image_base64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseModalities": ["image"],
                "imageConfig": {
                    "aspectRatio": "1:1"  # 正方形宽高比
                }
            }
        }
        
        print(f"[九宫格] 发送请求到: {api_url}")
        response = requests.post(api_url, headers=headers, params=params, json=payload, timeout=120)
        
        if response.status_code != 200:
            error_text = response.text
            print(f"[九宫格] API错误: {error_text}")
            raise HTTPException(status_code=response.status_code, detail=f"Gemini API调用失败: {error_text}")
        
        result = response.json()
        print(f"[九宫格] API完整响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        # 解析返回的图片数据
        if 'candidates' in result and len(result['candidates']) > 0:
            candidate = result['candidates'][0]
            print(f"[九宫格] candidate结构: {json.dumps(candidate, indent=2, ensure_ascii=False)}")
            
            if 'content' in candidate and 'parts' in candidate['content']:
                parts = candidate['content']['parts']
                print(f"[九宫格] parts数量: {len(parts)}")
                
                for i, part in enumerate(parts):
                    print(f"[九宫格] part[{i}]的keys: {part.keys()}")
                    
                    # Gemini API返回的是 inlineData（驼峰命名），不是 inline_data
                    if 'inlineData' in part:
                        # 获取生成的图片base64数据
                        generated_image_base64 = part['inlineData']['data']
                        print(f"[九宫格] 获取到base64数据，长度: {len(generated_image_base64)}")
                        
                        # 解码base64为二进制
                        img_data = base64.b64decode(generated_image_base64)
                        file_size = len(img_data)
                        
                        # 上传到TOS
                        ext = ".jpg"
                        key = f"uploads/{time.strftime('%Y%m%d')}/{int(time.time()*1000)}-nine-grid{ext}"
                        
                        print(f"[九宫格] 上传到TOS: {key}")
                        print(f"[九宫格] 文件大小: {file_size / 1024:.2f} KB")
                        
                        tos_result = tos_client.put_object(
                            bucket=TOS_BUCKET,
                            key=key,
                            content=BytesIO(img_data),
                            content_length=file_size,
                            content_type="image/jpeg"
                        )
                        
                        grid_url = build_public_url(TOS_BUCKET, key)
                        print(f"[九宫格] 上传成功: {grid_url}")
                        
                        # 2. 图片生成成功，扣除积分
                        old_credits = user.credits
                        user.credits -= CREDITS_COST
                        
                        # 3. 记录积分历史
                        credit_history = CreditHistory(
                            id=str(uuid.uuid4()),
                            user_id=req.user_id,
                            action="生成九宫格图片",
                            amount=-CREDITS_COST,
                            balance_after=user.credits,
                            description=f"生成九宫格图片消耗 {CREDITS_COST} 积分"
                        )
                        db.add(credit_history)
                        
                        # 4. 保存生成的图片记录到数据库
                        generated_image = GeneratedImage(
                            id=str(uuid.uuid4()),
                            user_id=req.user_id,
                            original_url=req.imageUrl,
                            grid_url=grid_url,
                            model_name=IMAGE_GEN_MODEL_NAME,
                            credits_cost=CREDITS_COST,
                            status='completed'
                        )
                        db.add(generated_image)
                        db.commit()
                        
                        print(f"[九宫格] 积分扣除成功: {old_credits} -> {user.credits}")
                        print(f"[九宫格] 图片记录已保存: {generated_image.id}")
                        print(f"✅ 九宫格图片生成并上传成功！")
                        
                        return {
                            "success": True,
                            "gridUrl": grid_url,
                            "originalUrl": req.imageUrl,
                            "imageId": generated_image.id,
                            "credits": user.credits,
                            "consumed": CREDITS_COST,
                            "message": f"九宫格图片生成成功，消耗{CREDITS_COST}积分，剩余{user.credits}积分"
                        }

        # 如果没有找到图片数据，打印完整响应帮助调试
        print(f"[九宫格] 未找到图片数据，完整响应结构:")
        print(f"  - 是否有candidates: {'candidates' in result}")
        if 'candidates' in result:
            print(f"  - candidates数量: {len(result['candidates'])}")
        raise HTTPException(status_code=500, detail="Gemini API返回格式异常，未找到生成的图片")
        
    except requests.exceptions.Timeout:
        print(f"[九宫格] API请求超时")
        raise HTTPException(status_code=504, detail="Gemini API请求超时，请稍后重试")
    except requests.exceptions.RequestException as e:
        print(f"[九宫格] 网络请求错误: {e}")
        raise HTTPException(status_code=500, detail=f"网络请求失败: {str(e)}")
    except Exception as e:
        print(f"[九宫格] 生成失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"九宫格图片生成失败: {str(e)}")


@app.get("/api/generated-images/{user_id}")
async def get_generated_images(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户生成的九宫格图片列表
    """
    print(f"[API] 获取用户 {user_id} 的九宫格图片列表")
    
    try:
        # 查询用户的所有成功生成的九宫格图片
        images = db.query(GeneratedImage).filter(
            GeneratedImage.user_id == user_id,
            GeneratedImage.status == 'completed'
        ).order_by(GeneratedImage.created_at.desc()).all()
        
        print(f"[API] 找到 {len(images)} 张九宫格图片")
        
        return {
            "success": True,
            "images": [
                {
                    "id": img.id,
                    "gridUrl": img.grid_url,
                    "originalUrl": img.original_url,
                    "modelName": img.model_name,
                    "creditsCost": img.credits_cost,
                    "createdAt": int(img.created_at.timestamp() * 1000),
                    "tags": img.tags or [],
                    "category": img.category
                }
                for img in images
            ]
        }
    except Exception as e:
        print(f"[API] 获取九宫格图片列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/generated-images/{image_id}")
async def delete_generated_image(image_id: str, user_id: str, db: Session = Depends(get_db)):
    """
    删除生成的九宫格图片记录（可选功能）
    """
    print(f"[API] 删除九宫格图片: {image_id}")
    
    try:
        # 查询图片记录
        image = db.query(GeneratedImage).filter(
            GeneratedImage.id == image_id,
            GeneratedImage.user_id == user_id
        ).first()
        
        if not image:
            raise HTTPException(status_code=404, detail="图片记录不存在")
        
        # 删除数据库记录（不删除TOS上的实际文件，保留以防万一）
        db.delete(image)
        db.commit()
        
        print(f"[API] 九宫格图片记录已删除")
        return {
            "success": True,
            "message": "图片记录已删除"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API] 删除失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
        # 如果没有找到图片数据，打印完整响应帮助调试
        print(f"[九宫格] 未找到图片数据，完整响应结构:")
        print(f"  - 是否有candidates: {'candidates' in result}")
        if 'candidates' in result:
            print(f"  - candidates数量: {len(result['candidates'])}")
            if len(result['candidates']) > 0:
                print(f"  - candidate[0]的keys: {result['candidates'][0].keys()}")
        raise HTTPException(status_code=500, detail="Gemini API返回格式异常，未找到生成的图片")
        
    except requests.RequestException as e:
        print(f"[九宫格] 网络请求失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"网络请求失败: {str(e)}")
    except Exception as e:
        print(f"[九宫格] 生成失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"九宫格图片生成失败: {str(e)}")


# ======================
# 2. AI 聊天接口
# ======================

@app.post("/api/chat", response_model=ChatResponse)
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

@app.post("/api/generate-script")
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
    # 修复：将 vertical 转换为 portrait，horizontal 转换为 landscape
    orientation = req.orientation
    if orientation == 'vertical':
        orientation = 'portrait'
    elif orientation == 'horizontal':
        orientation = 'landscape'
    
    # 打印前端传来的所有参数
    print("="*80)
    print("[视频生成] 前端请求参数:")
    print(f"  prompt: {req.prompt[:100]}..." if len(req.prompt) > 100 else f"  prompt: {req.prompt}")
    print(f"  images: {req.images}")
    print(f"  orientation: {req.orientation} -> 转换为: {orientation}")
    print(f"  size: {req.size} <- 重点检查！")
    print(f"  duration: {req.duration}")
    print(f"  watermark: {req.watermark}")
    print(f"  private: {req.private}")
    print(f"  character_id: {req.character_id}")
    print("="*80)
    
    try:
        # 调用 AI 视频生成
        result = await generate_video_with_ai(
            prompt=req.prompt,
            images=req.images,
            orientation=orientation,  # 使用转换后的orientation
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


@app.post("/api/query-video-task")
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
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # 根据API文档：https://yunwu.apifox.cn/api-358068905.md
        # 使用 GET /v1/video/query?id={task_id}
        api_url = f"{VIDEO_BASE_URL}/v1/video/query"
        params = {"id": task_id}
        
        print(f"[查询任务] 请求URL: {api_url}")
        print(f"[查询任务] 查询参数: id={task_id}")
        
        response = requests.get(
            api_url,
            params=params,
            headers=headers,
            timeout=10
        )
        
        print(f"[查询任务] 云雾API响应状态码: {response.status_code}")
        print(f"[查询任务] 原始响应内容: {response.text}")
        
        # 如果状态码不是200，返回一个默认的processing状态
        if response.status_code != 200:
            print(f"[查询任务] 云雾API错误: {response.text}")
            return {
                "id": task_id,
                "status": "processing",
                "progress": 10,
                "message": f"查询错误: {response.status_code}"
            }
        
        # 解析JSON
        try:
            result = response.json()
            print(f"[查询任务] ✅ 成功获取数据: {result}")
            print(f"[查询任务] status={result.get('status')}, video_url={result.get('video_url')}")
            
            # 根据API文档，返回字段包括：
            # - id: 任务ID
            # - status: 状态 (queued, processing, completed, failed)
            # - video_url: 视频URL（完成时有值）
            # - enhanced_prompt: 增强后prompt
            # - status_update_time: 状态更新时间
            
            # 检查是否完成
            if result.get('video_url'):
                result['status'] = 'completed'
                result['progress'] = 100
                print(f"[查询任务] 检测到video_url，标记为完成")
            elif result.get('status') == 'failed':
                result['progress'] = 0
                print(f"[查询任务] 任务失败")
            elif result.get('status') == 'processing' or result.get('status') == 'queued':
                # 根据状态设置进度
                if result.get('status') == 'queued':
                    result['progress'] = 5
                else:
                    result['progress'] = 50
                print(f"[查询任务] 任务处理中: {result.get('status')}")
            
            return result
            
        except Exception as json_error:
            print(f"[查询任务] JSON解析失败: {json_error}")
            return {
                "id": task_id,
                "status": "processing",
                "progress": 15,
                "message": "JSON解析失败"
            }
        
    except requests.RequestException as e:
        print(f"[查询任务] 请求异常: {str(e)}")
        return {
            "id": task_id,
            "status": "processing",
            "progress": 20,
            "message": f"网络错误: {str(e)}"
        }


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
    user_id: str  # 新增：用户ID
    name: str
    description: str
    age: Optional[int] = None
    gender: Optional[str] = None
    style: Optional[str] = None
    tags: Optional[List[str]] = None


@app.post("/api/create-character")
async def create_character(req: CreateCharacterRequest, db: Session = Depends(get_db)):
    """
    创建角色（保存到数据库）
    """
    try:
        # 生成角色ID
        character_id = str(uuid.uuid4())
        
        print(f"[创建角色] 用户ID: {req.user_id}")
        print(f"[创建角色] 角色名称: {req.name}")
        print(f"[创建角色] 角色ID: {character_id}")
        print(f"[创建角色] 描述长度: {len(req.description)} 字")
        
        # 保存到数据库
        new_character = Character(
            id=character_id,
            user_id=req.user_id,  # 使用前端传入的user_id
            name=req.name,
            description=req.description,
            age=req.age,
            gender=req.gender,
            style=req.style,
            tags=req.tags
        )
        db.add(new_character)
        db.commit()
        db.refresh(new_character)
        
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
        db.rollback()
        print(f"[创建角色错误] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"创建角色失败: {str(e)}")


# ======================
# 用户认证 API
# ======================

class RegisterRequest(BaseModel):
    """用户注册请求"""
    email: str
    password: str
    username: str

class LoginRequest(BaseModel):
    """用户登录请求"""
    email: str
    password: str

@app.post("/api/register")
async def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    用户注册
    """
    try:
        # 检查邮箱是否已存在
        existing_user = db.query(User).filter(User.email == req.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="该邮箱已注册")
        
        # 生成唯一用户ID
        user_id = str(uuid.uuid4())
        
        # 加密密码
        hashed_password = hash_password(req.password)
        
        # 创建新用户
        new_user = User(
            id=user_id,
            email=req.email,
            username=req.username,
            password_hash=hashed_password,  # 使用加密后的密码
            credits=100,  # 新用户赠送100积分
            role="user",
            is_active=True
        )
        db.add(new_user)
        
        # 记录积分历史
        credit_history = CreditHistory(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action="注册奖励",
            amount=100,
            balance_after=100,
            description="新用户注册赠送100积分"
        )
        db.add(credit_history)
        
        db.commit()
        db.refresh(new_user)
        
        print(f"[用户注册] 成功 - 用户ID: {user_id}, 邮箱: {req.email}")
        
        # 返回用户信息（不包含密码）
        return {
            "success": True,
            "user": {
                "id": user_id,
                "email": req.email,
                "username": req.username,
                "credits": 100,
                "role": "user",
                "createdAt": int(new_user.created_at.timestamp() * 1000) if new_user.created_at else None
            },
            "message": "注册成功！获得100积分奖励"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[用户注册错误] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"注册失败: {str(e)}")

@app.post("/api/login")
async def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    """
    用户登录
    """
    try:
        # 查找用户
        user = db.query(User).filter(User.email == req.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="邮箱或密码错误")
        
        # 验证密码（使用 bcrypt 验证）
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=401, detail="邮箱或密码错误")
        
        # 检查用户是否被禁用
        if not user.is_active:
            raise HTTPException(status_code=403, detail="账号已被禁用")
        
        print(f"[用户登录] 成功 - 用户ID: {user.id}, 邮箱: {user.email}")
        
        # 返回用户信息（不包含密码）
        return {
            "success": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "credits": user.credits,
                "role": user.role,
                "createdAt": int(user.created_at.timestamp() * 1000) if user.created_at else None
            },
            "message": "登录成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[用户登录错误] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"登录失败: {str(e)}")

# ======================
# 管理员 API
# ======================

ADMIN_USERS = {"admin@soradirector.com"}  # 管理员邮箱列表

@app.get("/api/public-videos")
async def get_public_videos(db: Session = Depends(get_db)):
    """
    获取所有公开的视频（内容广场）
    """
    try:
        public_videos = db.query(Video).filter(Video.is_public == True).all()
        return {
            "videos": [
                {
                    "id": v.id,
                    "url": v.video_url,
                    "thumbnail": v.thumbnail_url,
                    "script": v.script,
                    "productName": v.product_name,
                    "category": v.product_category,  # 新增：返回商品类目
                    "createdAt": to_beijing_timestamp(v.created_at),
                    "status": v.status,
                    "isPublic": v.is_public
                }
                for v in public_videos
            ]
        }
    except Exception as e:
        print(f"获取公开视频失败: {e}")
        return {"videos": []}

@app.get("/api/admin/stats")
async def get_admin_stats(db: Session = Depends(get_db)):
    """
    获取管理员统计数据
    """
    try:
        total_users = db.query(User).count()
        total_videos = db.query(Video).count()
        public_videos = db.query(Video).filter(Video.is_public == True).count()
        
        # 计算总消费积分（通过积分历史记录）
        total_credits_used = db.query(CreditHistory).filter(
            CreditHistory.amount < 0
        ).count() * 50  # 假设每次消费50积分
        
        return {
            "totalUsers": total_users,
            "totalVideos": total_videos,
            "publicVideos": public_videos,
            "totalCreditsUsed": abs(total_credits_used)
        }
    except Exception as e:
        print(f"获取统计数据失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/users")
async def get_all_users(db: Session = Depends(get_db)):
    """
    获取所有用户列表
    """
    try:
        users = db.query(User).all()
        return {
            "users": [
                {
                    "id": u.id,
                    "email": u.email,
                    "username": u.username,
                    "credits": u.credits,
                    "role": u.role,
                    "createdAt": u.created_at.timestamp() * 1000 if u.created_at else None,
                    "isActive": u.is_active
                }
                for u in users
            ]
        }
    except Exception as e:
        print(f"获取用户列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/videos")
async def get_all_videos(db: Session = Depends(get_db)):
    """
    获取所有视频（包括未公开的）
    """
    try:
        videos = db.query(Video).all()
        return {
            "videos": [
                {
                    "id": v.id,
                    "userId": v.user_id,
                    "url": v.video_url,
                    "thumbnail": v.thumbnail_url,
                    "script": v.script,
                    "productName": v.product_name,
                    "status": v.status,
                    "isPublic": v.is_public,
                    "createdAt": v.created_at.timestamp() * 1000 if v.created_at else None
                }
                for v in videos
            ]
        }
    except Exception as e:
        print(f"获取视频列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/prompts")
async def get_all_prompts(db: Session = Depends(get_db)):
    """
    获取所有提示词
    """
    try:
        prompts = db.query(SavedPrompt).all()
        return {
            "prompts": [
                {
                    "id": p.id,
                    "userId": p.user_id,
                    "content": p.content,
                    "productName": p.product_name,
                    "createdAt": p.created_at.timestamp() * 1000 if p.created_at else None
                }
                for p in prompts
            ]
        }
    except Exception as e:
        print(f"获取提示词列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/video/{video_id}/public")
async def toggle_video_public(video_id: str, isPublic: bool = True, db: Session = Depends(get_db)):
    """
    切换视频的公开状态
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
        
        video.is_public = isPublic
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        print(f"切换视频公开状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/video/{video_id}")
async def delete_video_admin(video_id: str, db: Session = Depends(get_db)):
    """
    删除视频
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
        
        db.delete(video)
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        print(f"删除视频失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class UpdateCreditsRequest(BaseModel):
    credits: int

@app.put("/api/admin/user/{user_id}/credits")
async def update_user_credits(user_id: str, req: UpdateCreditsRequest, db: Session = Depends(get_db)):
    """
    更新用户积分
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        old_credits = user.credits
        user.credits = req.credits
        
        # 记录积分变动
        credit_history = CreditHistory(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action="管理员调整积分",
            amount=req.credits - old_credits,
            balance_after=req.credits,
            description=f"管理员将积分从 {old_credits} 调整为 {req.credits}"
        )
        db.add(credit_history)
        db.commit()
        
        return {"success": True}
    except Exception as e:
        db.rollback()
        print(f"更新用户积分失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ======================
# 用户项目 API
# ======================

class CreateProjectRequest(BaseModel):
    user_id: str
    product_name: str
    product_description: Optional[str] = None

class CreateProductRequest(BaseModel):
    user_id: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    images: Optional[List[str]] = None  # 商品图片URL列表
    specs: Optional[dict] = None  # 商品规格（尺寸、重量等）
    selling_points: Optional[List[str]] = None  # 卖点

class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    images: Optional[List[str]] = None
    specs: Optional[dict] = None
    selling_points: Optional[List[str]] = None

class SaveVideoRequest(BaseModel):
    user_id: str
    project_id: Optional[str] = None
    video_url: str
    thumbnail_url: Optional[str] = None
    script: Optional[dict] = None
    product_name: Optional[str] = None
    prompt: Optional[str] = None
    is_public: bool = False
    task_id: Optional[str] = None  # 新增：Sora任务ID
    status: Optional[str] = 'completed'  # 新增：视频状态
    progress: Optional[int] = 0  # 新增：生成进度

class SavePromptRequest(BaseModel):
    user_id: str
    content: str
    product_name: Optional[str] = None

@app.post("/api/projects")
async def create_project(req: CreateProjectRequest, db: Session = Depends(get_db)):
    """
    创建项目
    """
    try:
        project_id = str(uuid.uuid4())
        new_project = Project(
            id=project_id,
            user_id=req.user_id,
            product_name=req.product_name,
            product_description=req.product_description,
            status='draft'
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        
        return {
            "success": True,
            "project": {
                "id": new_project.id,
                "productName": new_project.product_name,
                "productDescription": new_project.product_description,
                "status": new_project.status,
                "createdAt": new_project.created_at.timestamp() * 1000 if new_project.created_at else None
            }
        }
    except Exception as e:
        db.rollback()
        print(f"创建项目失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{user_id}")
async def get_user_projects(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户的所有项目
    """
    try:
        projects = db.query(Project).filter(Project.user_id == user_id).order_by(Project.created_at.desc()).all()
        return {
            "projects": [
                {
                    "id": p.id,
                    "productName": p.product_name,
                    "productDescription": p.product_description,
                    "status": p.status,
                    "createdAt": p.created_at.timestamp() * 1000 if p.created_at else None,
                    "updatedAt": p.updated_at.timestamp() * 1000 if p.updated_at else None
                }
                for p in projects
            ]
        }
    except Exception as e:
        print(f"获取项目列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/videos")
async def save_video(req: SaveVideoRequest, db: Session = Depends(get_db)):
    """
    保存视频
    """
    try:
        video_id = str(uuid.uuid4())
        new_video = Video(
            id=video_id,
            user_id=req.user_id,
            project_id=req.project_id,
            video_url=req.video_url,
            thumbnail_url=req.thumbnail_url,
            script=req.script,
            product_name=req.product_name,
            prompt=req.prompt,
            status=req.status or 'completed',  # ✅ 使用前端传入的status
            is_public=req.is_public,
            task_id=req.task_id,  # ✅ 保存task_id
            progress=req.progress or 0  # ✅ 保存progress
        )
        db.add(new_video)
        db.commit()
        db.refresh(new_video)
        
        return {
            "success": True,
            "video": {
                "id": new_video.id,
                "url": new_video.video_url,
                "thumbnail": new_video.thumbnail_url,
                "script": new_video.script,
                "productName": new_video.product_name,
                "status": new_video.status,  # ✅ 返回status
                "isPublic": new_video.is_public,
                "taskId": new_video.task_id,  # ✅ 返回taskId
                "progress": new_video.progress or 0,  # ✅ 返回progress
                "createdAt": new_video.created_at.timestamp() * 1000 if new_video.created_at else None
            }
        }
    except Exception as e:
        db.rollback()
        print(f"保存视频失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/videos/{user_id}")
async def get_user_videos(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户的所有视频
    """
    try:
        videos = db.query(Video).filter(Video.user_id == user_id).order_by(Video.created_at.desc()).all()
        return {
            "videos": [
                {
                    "id": v.id,
                    "url": v.video_url,
                    "thumbnail": v.thumbnail_url,
                    "script": v.script,
                    "productName": v.product_name,
                    "status": v.status,
                    "isPublic": v.is_public,
                    "taskId": v.task_id,  # ✅ 返回taskId
                    "progress": v.progress or 0,  # ✅ 返回progress
                    "error": v.error,  # ✅ 返回错误信息
                    "createdAt": v.created_at.timestamp() * 1000 if v.created_at else None
                }
                for v in videos
            ]
        }
    except Exception as e:
        print(f"获取视频列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/videos/{video_id}")
async def update_video(video_id: str, req: SaveVideoRequest, db: Session = Depends(get_db)):
    """
    更新视频状态和URL（用于异步视频完成后的状态同步）
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
        
        # 更新视频字段
        if req.video_url is not None:
            video.video_url = req.video_url
        if req.thumbnail_url is not None:
            video.thumbnail_url = req.thumbnail_url
        if req.status is not None:
            video.status = req.status
        if req.progress is not None:
            video.progress = req.progress
        if req.script is not None:
            video.script = req.script
        if req.product_name is not None:
            video.product_name = req.product_name
        
        db.commit()
        db.refresh(video)
        
        return {
            "success": True,
            "video": {
                "id": video.id,
                "url": video.video_url,
                "thumbnail": video.thumbnail_url,
                "script": video.script,
                "productName": video.product_name,
                "status": video.status,
                "isPublic": video.is_public,
                "taskId": video.task_id,
                "progress": video.progress or 0,
                "createdAt": video.created_at.timestamp() * 1000 if video.created_at else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"更新视频失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/videos/{video_id}")
async def delete_user_video(video_id: str, db: Session = Depends(get_db)):
    """
    删除用户视频
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
        
        db.delete(video)
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"删除视频失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/prompts")
async def save_prompt(req: SavePromptRequest, db: Session = Depends(get_db)):
    """
    保存提示词
    """
    try:
        prompt_id = str(uuid.uuid4())
        new_prompt = SavedPrompt(
            id=prompt_id,
            user_id=req.user_id,
            content=req.content,
            product_name=req.product_name
        )
        db.add(new_prompt)
        db.commit()
        db.refresh(new_prompt)
        
        return {
            "success": True,
            "prompt": {
                "id": new_prompt.id,
                "content": new_prompt.content,
                "productName": new_prompt.product_name,
                "createdAt": new_prompt.created_at.timestamp() * 1000 if new_prompt.created_at else None
            }
        }
    except Exception as e:
        db.rollback()
        print(f"保存提示词失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/prompts/{user_id}")
async def get_user_prompts(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户的所有提示词
    """
    try:
        prompts = db.query(SavedPrompt).filter(SavedPrompt.user_id == user_id).order_by(SavedPrompt.created_at.desc()).all()
        return {
            "prompts": [
                {
                    "id": p.id,
                    "content": p.content,
                    "productName": p.product_name,
                    "createdAt": p.created_at.timestamp() * 1000 if p.created_at else None
                }
                for p in prompts
            ]
        }
    except Exception as e:
        print(f"获取提示词列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, db: Session = Depends(get_db)):
    """
    删除提示词
    """
    try:
        prompt = db.query(SavedPrompt).filter(SavedPrompt.id == prompt_id).first()
        if not prompt:
            raise HTTPException(status_code=404, detail="提示词不存在")
        
        db.delete(prompt)
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"删除提示词失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ======================
# 积分管理 API
# ======================

class ConsumeCreditsRequest(BaseModel):
    """消费积分请求"""
    user_id: str
    amount: int
    action: str  # 消费类型：生成视频、生成脚本等
    description: Optional[str] = None

class RechargeCreditsRequest(BaseModel):
    """充值积分请求"""
    user_id: str
    amount: int  # 充值金额（元）
    credits: int  # 获得积分
    payment_method: str  # 支付方式：微信、支付宝等
    order_id: Optional[str] = None  # 订单ID（支付成功后由支付系统返回）

@app.post("/api/credits/consume")
async def consume_credits(req: ConsumeCreditsRequest, db: Session = Depends(get_db)):
    """
    消费积分
    用于生成视频、生成脚本等功能的积分扣除
    """
    try:
        # 查找用户
        user = db.query(User).filter(User.id == req.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 检查积分是否足够
        if user.credits < req.amount:
            raise HTTPException(
                status_code=400, 
                detail=f"积分不足！当前积分：{user.credits}，需要：{req.amount}"
            )
        
        # 更新用户积分
        old_credits = user.credits
        user.credits -= req.amount
        
        # 记录积分历史
        credit_history = CreditHistory(
            id=str(uuid.uuid4()),
            user_id=req.user_id,
            action=req.action,
            amount=-req.amount,  # 负数表示消费
            balance_after=user.credits,
            description=req.description or f"{req.action} 消耗 {req.amount} 积分"
        )
        db.add(credit_history)
        db.commit()
        
        print(f"[积分消费] 用户ID: {req.user_id}, 消耗: {req.amount}, 余额: {old_credits} -> {user.credits}")
        
        return {
            "success": True,
            "credits": user.credits,
            "consumed": req.amount,
            "message": f"消费 {req.amount} 积分成功，剩余 {user.credits} 积分"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[积分消费错误] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"消费积分失败: {str(e)}")

@app.post("/api/credits/recharge")
async def recharge_credits(req: RechargeCreditsRequest, db: Session = Depends(get_db)):
    """
    充值积分
    用户通过微信、支付宝等方式购买积分
    """
    try:
        # 查找用户
        user = db.query(User).filter(User.id == req.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 更新用户积分
        old_credits = user.credits
        user.credits += req.credits
        
        # 记录积分历史
        credit_history = CreditHistory(
            id=str(uuid.uuid4()),
            user_id=req.user_id,
            action=f"充值（{req.payment_method}）",
            amount=req.credits,  # 正数表示增加
            balance_after=user.credits,
            description=f"支付 {req.amount} 元，获得 {req.credits} 积分" + (f"，订单号: {req.order_id}" if req.order_id else "")
        )
        db.add(credit_history)
        db.commit()
        
        print(f"[积分充值] 用户ID: {req.user_id}, 充值: {req.credits}, 余额: {old_credits} -> {user.credits}")
        
        return {
            "success": True,
            "credits": user.credits,
            "recharged": req.credits,
            "amount": req.amount,
            "message": f"充值成功！获得 {req.credits} 积分，当前余额 {user.credits} 积分"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[积分充值错误] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"充值失败: {str(e)}")

@app.get("/api/credits/balance/{user_id}")
async def get_credits_balance(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户积分余额
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        return {
            "success": True,
            "user_id": user.id,
            "credits": user.credits,
            "username": user.username,
            "email": user.email
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"获取积分余额失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/{user_id}")
async def get_user_info(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户信息
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "credits": user.credits,
            "role": user.role,
            "isActive": user.is_active,
            "createdAt": user.created_at.timestamp() * 1000 if user.created_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"获取用户信息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/{user_id}/stats")
async def get_user_stats(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户统计数据：视频数、商品数、总消费积分
    """
    try:
        # 检查用户是否存在
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 统计用户视频数
        video_count = db.query(Video).filter(Video.user_id == user_id).count()
        
        # 统计用户商品数
        product_count = db.query(Product).filter(Product.user_id == user_id).count()
        
        # 统计总消费积分（积分历史中 amount < 0 的记录）
        consumed_records = db.query(CreditHistory).filter(
            CreditHistory.user_id == user_id,
            CreditHistory.amount < 0
        ).all()
        total_consumed = sum(abs(record.amount) for record in consumed_records)
        
        return {
            "success": True,
            "videoCount": video_count,
            "productCount": product_count,
            "totalConsumed": total_consumed
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"获取用户统计数据失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/credits/history/{user_id}")
async def get_credit_history(user_id: str, db: Session = Depends(get_db)):
    """
    获取积分历史
    """
    try:
        history = db.query(CreditHistory).filter(CreditHistory.user_id == user_id).order_by(CreditHistory.created_at.desc()).all()
        return {
            "history": [
                {
                    "id": h.id,
                    "action": h.action,
                    "amount": h.amount,
                    "balanceAfter": h.balance_after,
                    "description": h.description,
                    "createdAt": h.created_at.timestamp() * 1000 if h.created_at else None
                }
                for h in history
            ]
        }
    except Exception as e:
        print(f"获取积分历史失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/characters/{user_id}")
async def get_user_characters(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户的所有角色
    """
    try:
        characters = db.query(Character).filter(Character.user_id == user_id).order_by(Character.created_at.desc()).all()
        return {
            "characters": [
                {
                    "id": c.id,
                    "name": c.name,
                    "description": c.description,
                    "age": c.age,
                    "gender": c.gender,
                    "style": c.style,
                    "tags": c.tags,
                    "createdAt": c.created_at.timestamp() * 1000 if c.created_at else None
                }
                for c in characters
            ]
        }
    except Exception as e:
        print(f"获取角色列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ======================
# 商品管理 API
# ======================

@app.post("/api/products")
async def create_product(req: CreateProductRequest, db: Session = Depends(get_db)):
    """
    创建商品
    """
    try:
        product_id = str(uuid.uuid4())
        
        # 将 selling_points 列表转换为文本（用逗号分隔）
        selling_points_text = ', '.join(req.selling_points) if req.selling_points else ''
        
        new_product = Product(
            id=product_id,
            user_id=req.user_id,
            name=req.name,
            usage=req.description,  # 修复：将 description 映射到 usage 字段
            category=req.category,
            selling_points=selling_points_text,  # 修复：转换为文本
            image_urls=req.images  # 修复：字段名是 image_urls
        )
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        
        # 返回时转换回列表格式
        selling_points_list = selling_points_text.split(', ') if selling_points_text else []
        
        return {
            "success": True,
            "product": {
                "id": new_product.id,
                "name": new_product.name,
                "description": new_product.usage,  # 返回时映射回去
                "category": new_product.category,
                "images": new_product.image_urls,
                "sellingPoints": selling_points_list,
                "createdAt": new_product.created_at.timestamp() * 1000 if new_product.created_at else None
            }
        }
    except Exception as e:
        db.rollback()
        print(f"创建商品失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/products/{user_id}")
async def get_user_products(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户的所有商品
    """
    try:
        products = db.query(Product).filter(Product.user_id == user_id).order_by(Product.created_at.desc()).all()
        return {
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "usage": p.usage,  # 修复：使用 usage 字段而不是 description
                    "sellingPoints": p.selling_points,  # 修复：返回 selling_points
                    "imageUrls": p.image_urls,  # 修复：使用 image_urls 字段
                    "createdAt": p.created_at.timestamp() * 1000 if p.created_at else None,
                    "updatedAt": p.updated_at.timestamp() * 1000 if p.updated_at else None
                }
                for p in products
            ]
        }
    except Exception as e:
        print(f"获取商品列表失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/product/{product_id}")
async def get_product_detail(product_id: str, db: Session = Depends(get_db)):
    """
    获取单个商品详情
    """
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="商品不存在")
        
        return {
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "usage": product.usage,  # 修复：使用 usage 字段
            "sellingPoints": product.selling_points,
            "imageUrls": product.image_urls,  # 修复：使用 image_urls 字段
            "createdAt": product.created_at.timestamp() * 1000 if product.created_at else None,
            "updatedAt": product.updated_at.timestamp() * 1000 if product.updated_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"获取商品详情失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/product/{product_id}")
async def update_product(product_id: str, req: UpdateProductRequest, db: Session = Depends(get_db)):
    """
    更新商品信息
    """
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="商品不存在")
        
        # 更新字段
        if req.name is not None:
            product.name = req.name
        if req.description is not None:
            product.description = req.description
        if req.category is not None:
            product.category = req.category
        if req.price is not None:
            product.price = req.price
        if req.images is not None:
            product.images = req.images
        if req.specs is not None:
            product.specs = req.specs
        if req.selling_points is not None:
            product.selling_points = req.selling_points
        
        db.commit()
        db.refresh(product)
        
        return {
            "success": True,
            "product": {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "category": product.category,
                "price": product.price,
                "images": product.images,
                "specs": product.specs,
                "sellingPoints": product.selling_points,
                "updatedAt": product.updated_at.timestamp() * 1000 if product.updated_at else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"更新商品失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/product/{product_id}")
async def delete_product(product_id: str, db: Session = Depends(get_db)):
    """
    删除商品
    """
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="商品不存在")
        
        db.delete(product)
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"删除商品失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ======================
# 图片管理 API
# ======================

class DeleteImageRequest(BaseModel):
    url: str

@app.post("/api/delete-image")
async def delete_image(req: DeleteImageRequest):
    """
    从 TOS 删除图片
    """
    try:
        # 从 URL提取对象键
        # URL 格式：https://{bucket}.{region}.tos.volces.com/{key}
        url = req.url
        if not url:
            raise HTTPException(status_code=400, detail="图片URL不能为空")
        
        # 解析URL提取object_key
        # 例: https://soradirector-public.cn-beijing.tos.volces.com/uploads/xxx.jpg
        # 提取: uploads/xxx.jpg
        parts = url.split('.com/')
        if len(parts) < 2:
            raise HTTPException(status_code=400, detail="无效的图片URL")
        
        object_key = parts[1]
        print(f"[DELETE IMAGE] 开始删除图片: {object_key}")
        
        # 从 TOS 删除
        tos_client.delete_object(bucket=TOS_BUCKET, key=object_key)
        
        print(f"[DELETE IMAGE] ✅ 图片删除成功: {object_key}")
        return {"success": True, "message": "图片删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DELETE IMAGE] ❗ 删除图片失败: {str(e)}")
        import traceback
        traceback.print_exc()
        # 删除失败不抛出异常，返回false即可
        return {"success": False, "message": f"删除失败: {str(e)}"}


# ======================
# 微信支付 API
# ======================

class CreateOrderRequest(BaseModel):
    """创建订单请求"""
    package_id: str  # 套餐ID: small, medium, large, super
    user_id: str

class OrderResponse(BaseModel):
    """订单响应"""
    success: bool
    order_no: Optional[str] = None
    qr_code_url: Optional[str] = None  # 二维码链接
    amount: Optional[float] = None  # 支付金额（元）
    credits: Optional[int] = None  # 获得积分
    error: Optional[str] = None

# 充值套餐配置（按照 1元=100积分 的规则）
PACKAGES = {
    'small': {'amount': 10, 'credits': 1000, 'name': '尝鲜包'},  # 10元 = 1000积分
    'medium': {'amount': 49, 'credits': 4900, 'name': '标准包'},  # 49元 = 4900积分
    'large': {'amount': 99, 'credits': 9900, 'name': '旗舰包'},  # 99元 = 9900积分
    'super': {'amount': 499, 'credits': 49900, 'name': '企业包'},  # 499元 = 49900积分
}

@app.post("/api/wechat/create-order")
async def create_wechat_order(req: CreateOrderRequest, db: Session = Depends(get_db)):
    """
    创建微信支付订单（Native扫码支付）
    """
    # 获取套餐信息
    package = PACKAGES.get(req.package_id)
    if not package:
        raise HTTPException(status_code=400, detail="无效的套餐ID")
    
    # 生成订单号（时间戳+随机数）
    order_no = f"WX{int(time.time())}{uuid.uuid4().hex[:8].upper()}"
    
    # 金额转换为分
    total_fee = int(package['amount'] * 100)
    
    # 调用微信支付API创建订单
    result = create_native_order(
        order_no=order_no,
        total_fee=total_fee,
        body=f"{package['name']} - {package['credits']}积分",
        attach=req.user_id  # 将user_id作为附加数据
    )
    
    if not result['success']:
        raise HTTPException(status_code=500, detail=result.get('error', '创建订单失败'))
    
    # 保存订单到数据库（需要先创建Order表）
    # TODO: 添加到数据库
    # order = Order(
    #     id=str(uuid.uuid4()),
    #     user_id=req.user_id,
    #     order_no=order_no,
    #     amount=package['amount'],
    #     credits=package['credits'],
    #     status='pending',
    #     payment_method='wechat'
    # )
    # db.add(order)
    # db.commit()
    
    return {
        'success': True,
        'order_no': order_no,
        'qr_code_url': result['code_url'],
        'amount': package['amount'],
        'credits': package['credits']
    }

@app.post("/api/wechat/callback")
async def wechat_pay_callback(request: Request, db: Session = Depends(get_db)):
    """
    微信支付回调通知（V3版本）
    """
    # 读取JSON数据
    body_bytes = await request.body()
    body_str = body_bytes.decode('utf-8')
    data = json.loads(body_str)
    
    print(f"[WECHAT CALLBACK V3] 收到回调: {data}")
    
    # 获取签名相关信息
    timestamp = request.headers.get('Wechatpay-Timestamp', '')
    nonce = request.headers.get('Wechatpay-Nonce', '')
    signature = request.headers.get('Wechatpay-Signature', '')
    serial = request.headers.get('Wechatpay-Serial', '')
    
    # 验证签名
    if not verify_callback_signature(timestamp, nonce, body_str, signature, serial):
        print("[WECHAT CALLBACK V3] 签名验证失败")
        return JSONResponse(
            status_code=401,
            content={"code": "FAIL", "message": "签名验证失败"}
        )
    
    # 解密resource字段
    try:
        resource = data.get('resource', {})
        decrypted_data = decrypt_callback_resource(
            ciphertext=resource.get('ciphertext'),
            nonce=resource.get('nonce'),
            associated_data=resource.get('associated_data')
        )
        
        # 检查支付状态
        if decrypted_data.get('trade_state') == 'SUCCESS':
            order_no = decrypted_data.get('out_trade_no')
            transaction_id = decrypted_data.get('transaction_id')
            total_fee = decrypted_data.get('amount', {}).get('total', 0)
            user_id = decrypted_data.get('attach')  # 从附加数据获取user_id
            
            print(f"[WECHAT CALLBACK V3] 支付成功: {order_no}, 用户: {user_id}, 金额: {total_fee}分")
            
            # 给用户充值积分（根据金额计算积分）
            # 查找对应的套餐
            amount_yuan = total_fee / 100
            credits_to_add = 0
            
            for package in PACKAGES.values():
                if package['amount'] == amount_yuan:
                    credits_to_add = package['credits']
                    break
            
            if credits_to_add > 0 and user_id:
                try:
                    # 检查是否已经处理过（幂等性检查）
                    existing = db.query(CreditHistory).filter(
                        CreditHistory.related_id == order_no
                    ).first()
                    
                    if existing:
                        print(f"[WECHAT CALLBACK V3] 订单已处理，跳过: {order_no}")
                    else:
                        # 给用户加积分
                        user = db.query(User).filter(User.id == user_id).first()
                        if user:
                            old_credits = user.credits
                            user.credits += credits_to_add
                            
                            # 记录积分历史
                            history = CreditHistory(
                                id=str(uuid.uuid4()),
                                user_id=user_id,
                                action='recharge',
                                amount=credits_to_add,
                                balance_after=user.credits,
                                description=f"微信支付充值￥{amount_yuan}",
                                related_id=order_no
                            )
                            db.add(history)
                            db.commit()
                            
                            print(f"[WECHAT CALLBACK V3] ✅ 积分充值成功: {old_credits} -> {user.credits} (+{credits_to_add})")
                except Exception as e:
                    print(f"[WECHAT CALLBACK V3] 积分充值失败: {e}")
                    db.rollback()
    
    except Exception as e:
        print(f"[WECHAT CALLBACK V3] 处理回调失败: {e}")
        import traceback
        traceback.print_exc()
    
    # 返回SUCCESS给微信
    return JSONResponse(
        status_code=200,
        content={"code": "SUCCESS", "message": "OK"}
    )

@app.get("/api/wechat/query-order/{order_no}")
async def query_wechat_order(order_no: str):
    """
    查询订单支付状态
    """
    result = query_order(order_no)
    
    if not result['success']:
        return {
            'success': False,
            'error': result.get('error', '查询失败')
        }
    
    return {
        'success': True,
        'order_no': order_no,
        'status': result['trade_state'],  # SUCCESS/NOTPAY/CLOSED/...
        'paid': result['trade_state'] == 'SUCCESS'
    }


# ======================
# 管理员 API
# ======================

@app.get("/api/admin/users")
async def get_admin_users(db: Session = Depends(get_db)):
    """
    管理员：获取所有用户列表（包括付费数据）
    """
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()
        
        user_list = []
        for user in users:
            # 统计充值总额（amount > 0）
            recharge_records = db.query(CreditHistory).filter(
                CreditHistory.user_id == user.id,
                CreditHistory.amount > 0,
                CreditHistory.action.in_(['recharge', '管理员调整积分'])
            ).all()
            total_recharge = sum(record.amount for record in recharge_records)
            recharge_count = len([r for r in recharge_records if r.action == 'recharge'])
            
            # 统计消费总额（amount < 0）
            consume_records = db.query(CreditHistory).filter(
                CreditHistory.user_id == user.id,
                CreditHistory.amount < 0
            ).all()
            total_consume = abs(sum(record.amount for record in consume_records))
            
            user_list.append({
                "id": user.id,
                "email": user.email,
                "credits": user.credits,
                "role": user.role,
                "createdAt": user.created_at.timestamp() * 1000 if user.created_at else None,
                "totalRecharge": total_recharge,  # 积分总充值
                "rechargeCount": recharge_count,  # 充值次数
                "totalConsume": total_consume,    # 积分总消费
            })
        
        return {"users": user_list}
    except Exception as e:
        print(f"获取用户列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/prompts")
async def get_admin_prompts(
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db)
):
    """
    管理员：获取所有提示词（分页）
    """
    try:
        # 总数
        total = db.query(SavedPrompt).count()
        
        # 分页查询
        offset = (page - 1) * page_size
        prompts = db.query(SavedPrompt).order_by(
            SavedPrompt.created_at.desc()
        ).offset(offset).limit(page_size).all()
        
        prompt_list = []
        for prompt in prompts:
            # 获取用户邮箱
            user = db.query(User).filter(User.id == prompt.user_id).first()
            prompt_list.append({
                "id": prompt.id,
                "userId": prompt.user_id,
                "userEmail": user.email if user else '未知',
                "productName": prompt.product_name or '未命名',
                "content": prompt.content,
                "createdAt": prompt.created_at.timestamp() * 1000 if prompt.created_at else None,
            })
        
        return {
            "prompts": prompt_list,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    except Exception as e:
        print(f"获取提示词列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/stats")
async def get_admin_stats(db: Session = Depends(get_db)):
    """
    管理员：获取统计数据
    """
    try:
        # 总用户数
        total_users = db.query(User).count()
        
        # 总视频数
        total_videos = db.query(Video).count()
        
        # 公开视频数
        public_videos = db.query(Video).filter(Video.is_public == True).count()
        
        # 总消费积分
        consume_records = db.query(CreditHistory).filter(CreditHistory.amount < 0).all()
        total_credits_used = abs(sum(record.amount for record in consume_records))
        
        # 总充值金额（积分）
        recharge_records = db.query(CreditHistory).filter(
            CreditHistory.amount > 0,
            CreditHistory.action == 'recharge'
        ).all()
        total_recharge = sum(record.amount for record in recharge_records)
        
        return {
            "totalUsers": total_users,
            "totalVideos": total_videos,
            "publicVideos": public_videos,
            "totalCreditsUsed": total_credits_used,
            "totalRecharge": total_recharge
        }
    except Exception as e:
        print(f"获取统计数据失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/videos")
async def get_admin_videos(db: Session = Depends(get_db)):
    """
    管理员：获取所有视频列表
    """
    try:
        videos = db.query(Video).order_by(Video.created_at.desc()).all()
        
        video_list = []
        for video in videos:
            user = db.query(User).filter(User.id == video.user_id).first()
            video_list.append({
                "id": video.id,
                "userId": video.user_id,
                "userEmail": user.email if user else '未知',
                "title": video.product_name or '未命名视频',
                "thumbnail": video.thumbnail_url or '',
                "videoUrl": video.video_url,
                "script": video.script,
                "createdAt": video.created_at.timestamp() * 1000 if video.created_at else None,
                "isPublic": video.is_public or False,
            })
        
        return {"videos": video_list}
    except Exception as e:
        print(f"获取视频列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/video/{video_id}/public")
async def toggle_video_public(
    video_id: str,
    request: dict,
    db: Session = Depends(get_db)
):
    """
    管理员：切换视频公开状态
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
        
        video.is_public = request.get('isPublic', False)
        db.commit()
        
        return {"success": True}
    except Exception as e:
        db.rollback()
        print(f"切换视频公开状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/video/{video_id}")
async def delete_video_admin(video_id: str, db: Session = Depends(get_db)):
    """
    管理员：删除视频
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
        
        db.delete(video)
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        print(f"删除视频失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class UpdateCreditsRequest(BaseModel):
    credits: int

@app.put("/api/admin/user/{user_id}/credits")
async def update_user_credits(user_id: str, req: UpdateCreditsRequest, db: Session = Depends(get_db)):
    """
    管理员：调整用户积分
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        old_credits = user.credits
        user.credits = req.credits
        
        # 记录积分变动
        credit_history = CreditHistory(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action="管理员调整积分",
            amount=req.credits - old_credits,
            balance_after=req.credits,
            description=f"管理员将积分从 {old_credits} 调整为 {req.credits}"
        )
        db.add(credit_history)
        db.commit()
        
        return {"success": True}
    except Exception as e:
        db.rollback()
        print(f"更新用户积分失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ======================
# 启动服务
# ======================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
