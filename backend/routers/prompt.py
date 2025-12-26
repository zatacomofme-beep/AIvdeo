"""
提示词管理路由模块

提供提示词相关功能：
- 提示词保存
- 提示词列表查询
- 提示词删除
"""
from typing import Optional
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, SavedPrompt


router = APIRouter(prefix="/api", tags=["Prompt Management"])


# ======================
# Pydantic 数据模型
# ======================

class SavePromptRequest(BaseModel):
    """保存提示词请求"""
    user_id: str
    content: str
    product_name: Optional[str] = None


# ======================
# 提示词管理接口
# ======================

@router.post("/prompts")
async def save_prompt(req: SavePromptRequest, db: Session = Depends(get_db)):
    """
    保存提示词
    
    Args:
        req: 提示词信息
            - user_id: 用户ID
            - content: 提示词内容
            - product_name: 商品名称
    
    返回：
        - success: 是否成功
        - prompt: 提示词信息
    
    **前端对应**: MainWorkspace.tsx 保存提示词功能
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
        
        print(f"[提示词保存] 用户 {req.user_id} 保存提示词: {prompt_id}")
        
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
        print(f"[提示词保存] 保存提示词失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prompts/{user_id}")
async def get_user_prompts(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户的所有提示词
    
    Args:
        user_id: 用户ID
    
    返回：
        - prompts: 提示词列表（按创建时间倒序）
    
    **前端对应**: UserCenter.tsx 我的提示词列表
    """
    try:
        prompts = db.query(SavedPrompt).filter(
            SavedPrompt.user_id == user_id
        ).order_by(SavedPrompt.created_at.desc()).all()
        
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
        print(f"[提示词列表] 获取用户 {user_id} 提示词列表失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, db: Session = Depends(get_db)):
    """
    删除提示词
    
    Args:
        prompt_id: 提示词ID
    
    **前端对应**: UserCenter.tsx 删除提示词功能
    """
    try:
        prompt = db.query(SavedPrompt).filter(SavedPrompt.id == prompt_id).first()
        if not prompt:
            raise HTTPException(status_code=404, detail="提示词不存在")
        
        db.delete(prompt)
        db.commit()
        
        print(f"[提示词删除] 删除提示词: {prompt_id}")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[提示词删除] 删除提示词 {prompt_id} 失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
