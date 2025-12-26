"""
角色管理路由模块

提供角色相关功能：
- 获取用户角色列表
"""
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, Character


router = APIRouter(prefix="/api", tags=["Character Management"])


# ======================
# 角色管理接口
# ======================

@router.get("/characters/{user_id}")
async def get_user_characters(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户的所有角色
    
    Args:
        user_id: 用户ID
    
    返回：
        - characters: 角色列表（按创建时间倒序）
    
    **前端对应**: UserCenter.tsx 我的角色列表
    """
    try:
        characters = db.query(Character).filter(
            Character.user_id == user_id
        ).order_by(Character.created_at.desc()).all()
        
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
        print(f"[角色列表] 获取用户 {user_id} 角色列表失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
