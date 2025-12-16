from __future__ import annotations

import os
import time
import uuid
import asyncio
import requests
from typing import Any, List, Optional

import boto3
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "gemini-3-pro-preview")
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

# S3 兼容客户端（用于访问火山云 TOS）
from botocore.config import Config

s3_client = boto3.client(
    "s3",
    endpoint_url=TOS_ENDPOINT,
    aws_access_key_id=TOS_ACCESS_KEY,
    aws_secret_access_key=TOS_SECRET_KEY,
    region_name=TOS_REGION,
    config=Config(signature_version='s3v4')
)

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
    script: Optional[List[Any]] = None


class ChatResponse(BaseModel):
    message: Message
    projectUpdate: Optional[ProjectUpdate] = None


class ChatRequest(BaseModel):
    content: str
    context: Optional[dict[str, Any]] = None


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


# ======================
# FastAPI 应用初始化
# ======================

app = FastAPI(title="SoraDirector Backend", version="0.1.0")

# CORS：开发阶段先全放开
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================
# AI 工具函数
# ======================

async def chat_with_ai(prompt: str, system_prompt: str = None) -> str:
    """
    使用 AI 对话模型生成回复
    """
    if not ai_client:
        # 如果没有配置 API Key，返回默认回复
        return "收到。正在分析您的请求并检索约束数据库..."
    
    try:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
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
                                private: bool = True) -> dict:
    """
    使用 Sora API 生成视频（云雾 API）
    """
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
            "prompt": prompt,
            "images": images if images else [],
            "orientation": orientation,
            "size": size,
            "duration": duration,
            "watermark": watermark,
            "private": private
        }
        
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
    return {"message": "SoraDirector Backend is running", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# ======================
# 1. 上传图片到火山云 TOS
# ======================

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="只允许上传图片文件")

    # 生成唯一文件名
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    key = f"uploads/{time.strftime('%Y%m%d')}/{int(time.time()*1000)}-{uuid.uuid4().hex}{ext}"

    print(f"[Upload] 开始上传: {file.filename}")
    print(f"[Upload] Bucket: {TOS_BUCKET}")
    print(f"[Upload] Key: {key}")
    print(f"[Upload] Endpoint: {TOS_ENDPOINT}")
    print(f"[Upload] AK: {TOS_ACCESS_KEY[:10]}...")

    try:
        s3_client.upload_fileobj(
            Fileobj=file.file,
            Bucket=TOS_BUCKET,
            Key=key,
            ExtraArgs={"ContentType": file.content_type},
        )
        print(f"[Upload] 上传成功: {key}")
    except Exception as e:
        print(f"[Upload Error] TOS 上传失败: {type(e).__name__}")
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
    
    # 系统提示词：定义 AI 导演的角色
    system_prompt = """你是 SoraDirector 的 AI 导演助手，专门帮助用户创作产品视频。
    
你的主要职责：
1. 理解用户的产品和创意需求
2. 提供专业的视频创作建议
3. 引导用户确认关键信息（如产品尺寸、目标市场、情绪基调等）
4. 生成简洁、有吸引力的视频脚本描述

回答风格：简洁、专业、友好，直接给出建议。"""
    
    # 逻辑分支 1: 识别容器/产品
    if ("喷雾" in content) or ("瓶" in content) or ("spray" in lower) or ("bottle" in lower):
        msg = Message(
            id=now_id,
            role="ai",
            content="检测到产品容器。为了防止 AI 产生幻觉搞错尺寸，请确认实际大小：",
            type="scale_selector",
            chips=[
                Chip(label="💄 口红级 (10cm)", value="mini"),
                Chip(label="🥤 矿泉水瓶级", value="normal"),
                Chip(label="🍾 大酒瓶级", value="large"),
            ],
        )
        return ChatResponse(message=msg)
    
    # 使用真实 AI 生成回复
    try:
        ai_response = await chat_with_ai(content, system_prompt)
        msg = Message(
            id=now_id,
            role="ai",
            content=ai_response,
            type="text",
        )
        return ChatResponse(message=msg)
    except Exception as e:
        print(f"聊天错误: {e}")
        # 如果 AI 调用失败，返回默认回复
        msg = Message(
            id=now_id,
            role="ai",
            content="收到。正在分析您的请求并检索约束数据库...",
            type="text",
        )
        return ChatResponse(message=msg)


# ======================
# 3. 锁定物理属性
# ======================

@app.post("/lock-physics", response_model=ChatResponse)
async def lock_physics(req: LockPhysicsRequest):
    now_id = str(int(time.time() * 1000))

    msg = Message(
        id=now_id,
        role="ai",
        content=f"尺寸已锁定为 [{req.scale}]。物理引擎已更新。这部视频的核心情绪基调是什么？",
        type="text",
    )
    update = ProjectUpdate(scale=req.scale)
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
