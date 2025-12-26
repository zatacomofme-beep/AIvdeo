"""
AI生成服务路由模块

负责处理视频生成和角色生成的API接口
"""

import os
import uuid
import requests
import json
import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db, Character
from services.ai_helper import generate_video_with_ai, ai_client, LLM_MODEL_NAME
from prompts import (
    CHARACTER_GENERATION_SYSTEM_PROMPT,
    get_character_generation_prompt
)

# 配置
VIDEO_API_KEY = os.getenv("VIDEO_GENERATION_API_KEY")
VIDEO_BASE_URL = os.getenv("VIDEO_GENERATION_ENDPOINT", "https://yunwu.ai")

router = APIRouter(prefix="/api")


# ==================== 数据模型 ====================

class GenerateVideoRequest(BaseModel):
    prompt: str
    images: Optional[List[str]] = []
    orientation: Optional[str] = "portrait"
    size: Optional[str] = "large"
    duration: Optional[int] = 10
    watermark: Optional[bool] = False
    private: Optional[bool] = True
    character_id: Optional[str] = None


class VideoTaskRequest(BaseModel):
    task_id: str


class GenerateCharacterRequest(BaseModel):
    model: Optional[str] = "gpt-4"
    prompt: Optional[str] = None
    country: Optional[str] = None
    ethnicity: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None


class CreateCharacterRequest(BaseModel):
    user_id: str
    name: str
    description: str
    age: Optional[int] = None
    gender: Optional[str] = None
    style: Optional[str] = None
    tags: Optional[List[str]] = None


# ==================== 视频生成接口 ====================

@router.post("/generate-video")
async def generate_video(req: GenerateVideoRequest):
    """
    调用Sora API生成视频
    """
    # 修复方向参数
    orientation = req.orientation
    if orientation == 'vertical':
        orientation = 'portrait'
    elif orientation == 'horizontal':
        orientation = 'landscape'
    
    print("="*80)
    print("[视频生成] 前端请求参数:")
    print(f"  prompt: {req.prompt[:100]}..." if len(req.prompt) > 100 else f"  prompt: {req.prompt}")
    print(f"  images: {req.images}")
    print(f"  orientation: {req.orientation} -> {orientation}")
    print(f"  size: {req.size}")
    print(f"  duration: {req.duration}")
    print(f"  character_id: {req.character_id}")
    print("="*80)
    
    try:
        result = await generate_video_with_ai(
            prompt=req.prompt,
            images=req.images,
            orientation=orientation,
            size=req.size or "large",
            duration=req.duration or 10,
            watermark=req.watermark or False,
            private=req.private if req.private is not None else True,
            character_id=req.character_id
        )
        return result
    except Exception as e:
        print(f"[视频生成] 错误: {e}")
        raise HTTPException(status_code=500, detail=f"视频生成失败: {str(e)}")


@router.post("/query-video-task")
async def query_video_task(req: VideoTaskRequest):
    """
    查询视频生成任务状态（POST版本）
    """
    if not VIDEO_API_KEY:
        raise HTTPException(status_code=400, detail="视频生成服务未配置")
    
    try:
        headers = {
            "Authorization": f"Bearer {VIDEO_API_KEY}",
            "Content-Type": "application/json"
        }
        
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


@router.get("/video-task/{task_id}")
async def query_video_task_get(task_id: str):
    """
    查询视频生成任务状态（GET版本）
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
        
        api_url = f"{VIDEO_BASE_URL}/v1/video/query"
        params = {"id": task_id}
        
        response = requests.get(
            api_url,
            params=params,
            headers=headers,
            timeout=10
        )
        
        print(f"[查询任务] 响应状态码: {response.status_code}")
        
        if response.status_code != 200:
            return {
                "id": task_id,
                "status": "processing",
                "progress": 10,
                "message": f"查询错误: {response.status_code}"
            }
        
        try:
            result = response.json()
            
            if result.get('video_url'):
                result['status'] = 'completed'
                result['progress'] = 100
            elif result.get('status') == 'failed':
                result['progress'] = 0
            elif result.get('status') in ['processing', 'queued']:
                result['progress'] = 5 if result.get('status') == 'queued' else 50
            
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


# ==================== 角色生成接口 ====================

@router.post("/generate-character")
async def generate_character(req: GenerateCharacterRequest):
    """
    使用AI生成角色信息
    """
    print("="*80)
    print("[API] /api/generate-character 收到请求")
    print(f"  country: {req.country}")
    print(f"  ethnicity: {req.ethnicity}")
    print(f"  age: {req.age}")
    print(f"  gender: {req.gender}")
    print("="*80)
    
    if not ai_client:
        raise HTTPException(status_code=400, detail="AI服务未配置")
    
    prompt = req.prompt or get_character_generation_prompt(
        country=req.country or "",
        ethnicity=req.ethnicity or "",
        age=req.age or 25,
        gender=req.gender or "female"
    )
    
    try:
        print(f"[AI调用] 模型: {LLM_MODEL_NAME}")
        response = ai_client.chat.completions.create(
            model=LLM_MODEL_NAME,
            messages=[
                {"role": "system", "content": CHARACTER_GENERATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=500
        )
        
        content = response.choices[0].message.content
        if content:
            content = content.strip()
        else:
            raise HTTPException(status_code=500, detail="AI返回空内容")
        
        # 解析JSON
        json_match = re.search(r'```(?:json)?\s*({[^`]+})\s*```', content)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = content
        
        character_data = json.loads(json_str)
        print(f"[成功] 解析角色数据")
        print("="*80)
        return character_data
        
    except Exception as e:
        print(f"[AI生成角色错误] {str(e)}")
        import traceback
        traceback.print_exc()
        print("="*80)
        raise HTTPException(status_code=500, detail=f"生成角色失败: {str(e)}")


@router.post("/create-character")
async def create_character(req: CreateCharacterRequest, db: Session = Depends(get_db)):
    """
    创建角色（保存到数据库）
    """
    try:
        character_id = str(uuid.uuid4())
        
        print(f"[创建角色] 用户ID: {req.user_id}")
        print(f"[创建角色] 角色名称: {req.name}")
        print(f"[创建角色] 角色ID: {character_id}")
        
        new_character = Character(
            id=character_id,
            user_id=req.user_id,
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
