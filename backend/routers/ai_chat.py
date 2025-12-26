"""
AI聊天和脚本生成路由模块

负责处理AI对话和脚本生成的API接口
"""

import os
import time
import json
import re
from typing import Any, List, Optional, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.ai_helper import chat_with_ai
from prompts import (
    AI_DIRECTOR_SYSTEM_PROMPT,
    FORM_BASED_SCRIPT_SYSTEM_PROMPT,
    get_form_based_script_prompt,
    IMAGE_BASED_SCRIPT_SYSTEM_PROMPT,
    get_image_based_script_prompt
)

router = APIRouter(prefix="/api")


# ==================== 数据模型 ====================

class Chip(BaseModel):
    label: str
    value: str


class Message(BaseModel):
    id: str
    role: str
    content: str
    type: Optional[str] = None
    chips: Optional[List[Chip]] = None


class ProjectUpdate(BaseModel):
    character: Optional[dict] = None
    script: Optional[List[Any]] = None
    product_name: Optional[str] = None


class ChatResponse(BaseModel):
    message: Message
    projectUpdate: Optional[ProjectUpdate] = None


class ChatRequest(BaseModel):
    content: str
    context: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None
    history: Optional[List[dict]] = None


class ProductInfo(BaseModel):
    productName: str
    size: Optional[str] = None
    weight: Optional[str] = None
    sellingPoints: str
    targetMarket: str
    ageGroup: str
    gender: str
    style: str


class GenerateScriptRequest(BaseModel):
    productInfo: ProductInfo
    imageUrl: Optional[str] = None


class GenerateScriptFromProductRequest(BaseModel):
    productName: str
    productImages: List[str]
    usageMethod: str
    sellingPoints: List[str]
    language: str
    duration: int


# ==================== AI聊天接口 ====================

@router.post("/chat", response_model=ChatResponse)
async def send_chat(req: ChatRequest):
    """
    AI聊天对话接口
    
    支持多模态输入、对话历史、结构化数据返回
    """
    content = req.content
    now_id = str(int(time.time() * 1000))
    system_prompt = AI_DIRECTOR_SYSTEM_PROMPT
    
    try:
        ai_response = await chat_with_ai(
            content,
            system_prompt,
            image_url=req.image_url,
            history=req.history
        )
        
        # 解析结构化数据
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
        
        msg = Message(
            id=now_id,
            role="ai",
            content=ai_response,
            type="text",
        )
        return ChatResponse(message=msg)
        
    except Exception as e:
        print(f"[CHAT] 错误: {e}")
        import traceback
        traceback.print_exc()
        msg = Message(
            id=now_id,
            role="ai",
            content="收到。正在分析您的请求并检索约束数据库...",
            type="text",
        )
        return ChatResponse(message=msg)


# ==================== 脚本生成接口 ====================

@router.post("/generate-script")
async def generate_script(req: GenerateScriptRequest):
    """
    基于产品信息生成完整视频脚本
    """
    try:
        info = req.productInfo
        
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
        ai_response = await chat_with_ai(
            prompt,
            FORM_BASED_SCRIPT_SYSTEM_PROMPT,
            image_url=req.imageUrl
        )
        
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
        print(f"[SCRIPT] JSON解析错误: {e}")
        raise HTTPException(status_code=500, detail=f"AI返回数据解析失败: {str(e)}")
    except Exception as e:
        print(f"[SCRIPT] 错误: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"生成脚本失败: {str(e)}")


@router.post("/generate-script-ai")
async def generate_script_ai(req: GenerateScriptFromProductRequest):
    """
    根据商品图片生成视频脚本
    """
    try:
        if len(req.productImages) != 5:
            raise HTTPException(status_code=400, detail="必须提供恰好5张商品图片")
        
        if not req.productName or not req.usageMethod:
            raise HTTPException(status_code=400, detail="商品名称和使用方式不能为空")
        
        if not req.sellingPoints or len(req.sellingPoints) == 0:
            raise HTTPException(status_code=400, detail="必须提供至少一个核心卖点")
        
        language_map = {
            'zh-CN': '中文',
            'en-US': '英文',
            'id-ID': '印尼语',
            'vi-VN': '越南语',
        }
        target_language = language_map.get(req.language, '中文')
        
        prompt = get_image_based_script_prompt(
            product_name=req.productName,
            usage_method=req.usageMethod,
            selling_points=req.sellingPoints,
            language=target_language,
            duration=req.duration,
            num_images=len(req.productImages)
        )
        
        ai_response = await chat_with_ai(
            prompt,
            IMAGE_BASED_SCRIPT_SYSTEM_PROMPT,
            image_url=req.productImages[0]
        )
        
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if not json_match:
            raise HTTPException(status_code=500, detail="AI生成脚本失败，格式错误")
        
        result = json.loads(json_match.group())
        shots = result.get('shots', [])
        
        if not shots:
            raise HTTPException(status_code=500, detail="生成的脚本为空")
        
        for i, shot in enumerate(shots):
            if 'imageIndex' not in shot:
                shot['imageIndex'] = i % len(req.productImages)
        
        print(f"[SCRIPT] 成功生成 {len(shots)} 个镜头")
        
        return {
            "success": True,
            "shots": shots
        }
        
    except json.JSONDecodeError as e:
        print(f"[SCRIPT] JSON解析错误: {e}")
        raise HTTPException(status_code=500, detail=f"AI返回数据解析失败: {str(e)}")
    except Exception as e:
        print(f"[SCRIPT] 错误: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"生成脚本失败: {str(e)}")
