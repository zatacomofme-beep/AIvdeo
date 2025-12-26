"""
AI辅助服务模块

提供AI相关的共享工具函数，避免循环导入
- AI对话函数
- 视频生成函数
"""

import os
import asyncio
import base64
import requests
from typing import List, Optional, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# AI配置
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://yunwu.ai")
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash-exp")

VIDEO_API_KEY = os.getenv("VIDEO_GENERATION_API_KEY")
VIDEO_BASE_URL = os.getenv("VIDEO_GENERATION_ENDPOINT", "https://yunwu.ai")

# 初始化AI客户端
ai_client = None
if LLM_API_KEY:
    ai_client = OpenAI(
        api_key=LLM_API_KEY,
        base_url=f"{LLM_BASE_URL}/v1"
    )


def url_to_base64(image_url: str) -> Optional[str]:
    """将图片URL转换为base64编码"""
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        image_data = response.content
        base64_str = base64.b64encode(image_data).decode('utf-8')
        content_type = response.headers.get('Content-Type', 'image/jpeg')
        return f"data:{content_type};base64,{base64_str}"
    except Exception as e:
        print(f"[ERROR] 图片转换base64失败: {e}")
        return None


async def chat_with_ai(
    prompt: str,
    system_prompt: Optional[str] = None,
    image_url: Optional[str] = None,
    history: Optional[List[dict]] = None
) -> str:
    """
    使用AI对话模型生成回复（支持多模态+对话历史）
    
    参数:
        prompt: 用户输入
        system_prompt: 系统提示词
        image_url: 图片URL或base64
        history: 对话历史
    
    返回:
        AI生成的回复文本
    """
    if not ai_client:
        return "收到。正在分析您的请求并检索约束数据库..."
    
    try:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # 添加历史对话（最近10轮）
        if history:
            messages.extend(history[-20:])
        
        # 如果有图片，使用多模态格式
        if image_url:
            # 判断是否已经是base64格式
            if image_url.startswith('data:image'):
                base64_image = image_url
            else:
                base64_image = url_to_base64(image_url)
                if not base64_image:
                    messages.append({"role": "user", "content": prompt})
                    base64_image = None
            
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
        else:
            messages.append({"role": "user", "content": prompt})
        
        response = ai_client.chat.completions.create(
            model=LLM_MODEL_NAME,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        if hasattr(response, 'choices') and len(response.choices) > 0:
            content = response.choices[0].message.content
            return content or "AI返回了空内容"
        else:
            return "收到。正在分析您的请求..."
            
    except Exception as e:
        print(f"[ERROR] AI对话错误: {e}")
        import traceback
        traceback.print_exc()
        return "抱歉，AI服务暂时不可用。请稍后再试。"


async def generate_video_with_ai(
    prompt: str,
    images: Optional[List[str]] = None,
    orientation: str = "portrait",
    size: str = "large",
    duration: int = 10,
    watermark: bool = False,
    private: bool = True,
    character_id: Optional[str] = None,
    product_attributes: Optional[Dict[str, Any]] = None,
    negative_prompts: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    使用Sora API生成视频
    
    参数:
        prompt: 视频描述
        images: 图片URL列表
        orientation: 方向（portrait/landscape）
        size: 尺寸
        duration: 时长
        watermark: 是否有水印
        private: 是否私有
        character_id: 角色ID
        product_attributes: 产品属性
        negative_prompts: 负面提示词
    
    返回:
        包含task_id的响应字典
    """
    # 优化Prompt
    enhanced_prompt = prompt
    
    if product_attributes:
        material_desc = []
        if product_attributes.get('material'):
            material_desc.append(f"{product_attributes['material']} material")
        if product_attributes.get('shape'):
            material_desc.append(f"{product_attributes['shape']} shape")
        if product_attributes.get('color'):
            material_desc.append(f"{product_attributes['color']} color")
        
        material_desc.extend(["geometric", "solid", "sturdy", "clean lines", "professional product shot"])
        
        if material_desc:
            enhanced_prompt = f"{prompt}\n\nProduct details: {', '.join(material_desc)}"
    
    if negative_prompts and len(negative_prompts) > 0:
        enhanced_prompt = f"{enhanced_prompt}\n\nAvoid: {', '.join(negative_prompts)}"
    
    if not VIDEO_API_KEY:
        # 模拟响应
        await asyncio.sleep(1)
        return {
            "task_id": f"mock-task-{int(asyncio.get_event_loop().time() * 1000)}",
            "status": "processing",
            "message": "视频生成中..."
        }
    
    try:
        # 准备请求数据
        payload = {
            "model": "sora-5s",
            "prompt": enhanced_prompt,
            "size": orientation,
            "duration": duration
        }
        
        if images and len(images) > 0:
            payload["image_url"] = images[0]
        
        if character_id:
            payload["character_id"] = character_id
        
        # 调用云雾API
        headers = {
            "Authorization": f"Bearer {VIDEO_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{VIDEO_BASE_URL}/v1/video/generations",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            return {
                "error": True,
                "message": f"视频生成请求失败: {response.text}"
            }
        
        result = response.json()
        return result
        
    except Exception as e:
        print(f"[ERROR] 视频生成错误: {e}")
        return {
            "error": True,
            "message": f"视频生成失败: {str(e)}"
        }
