"""
视频管理路由模块

提供视频相关功能：
- 视频保存和更新
- 视频列表查询
- 视频删除
- 视频任务状态查询
"""
from typing import Optional, List
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, Video


router = APIRouter(prefix="/api", tags=["Video Management"])


# ======================
# Pydantic 数据模型
# ======================

class SaveVideoRequest(BaseModel):
    """保存视频请求"""
    user_id: str
    project_id: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    script: Optional[List[dict]] = None
    product_name: Optional[str] = None
    prompt: Optional[str] = None
    status: Optional[str] = "processing"  # processing, completed, failed
    is_public: Optional[bool] = False
    task_id: Optional[str] = None
    progress: Optional[int] = 0


# ======================
# 视频管理接口
# ======================

@router.post("/videos")
async def save_video(req: SaveVideoRequest, db: Session = Depends(get_db)):
    """
    保存视频记录
    
    Args:
        req: 视频信息
            - user_id: 用户ID
            - video_url: 视频URL（可选，处理中时为None）
            - status: 状态（processing/completed/failed）
            - task_id: 任务ID（用于轮询查询）
            - progress: 进度（0-100）
    
    返回：
        - success: 是否成功
        - video: 视频信息
    
    **前端对应**: MainWorkspace.tsx 视频生成后保存记录
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
            status=req.status or 'completed',
            is_public=req.is_public,
            task_id=req.task_id,
            progress=req.progress or 0
        )
        db.add(new_video)
        db.commit()
        db.refresh(new_video)
        
        print(f"[视频保存] 用户 {req.user_id} 保存视频: {video_id} (状态: {req.status})")
        
        return {
            "success": True,
            "video": {
                "id": new_video.id,
                "url": new_video.video_url,
                "thumbnail": new_video.thumbnail_url,
                "script": new_video.script,
                "productName": new_video.product_name,
                "status": new_video.status,
                "isPublic": new_video.is_public,
                "taskId": new_video.task_id,
                "progress": new_video.progress or 0,
                "createdAt": new_video.created_at.timestamp() * 1000 if new_video.created_at else None
            }
        }
    except Exception as e:
        db.rollback()
        print(f"[视频保存] 保存视频失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/videos/{user_id}")
async def get_user_videos(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户的所有视频
    
    Args:
        user_id: 用户ID
    
    返回：
        - videos: 视频列表（按创建时间倒序）
    
    **前端对应**: UserCenter.tsx 我的视频列表
    """
    try:
        videos = db.query(Video).filter(
            Video.user_id == user_id
        ).order_by(Video.created_at.desc()).all()
        
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
                    "taskId": v.task_id,
                    "progress": v.progress or 0,
                    "error": v.error,
                    "createdAt": v.created_at.timestamp() * 1000 if v.created_at else None
                }
                for v in videos
            ]
        }
    except Exception as e:
        print(f"[视频列表] 获取用户 {user_id} 视频列表失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/videos/{video_id}")
async def update_video(
    video_id: str, 
    req: SaveVideoRequest, 
    db: Session = Depends(get_db)
):
    """
    更新视频信息
    
    用于异步视频完成后的状态同步：
    - 更新视频URL
    - 更新处理状态
    - 更新进度
    - 更新缩略图
    
    Args:
        video_id: 视频ID
        req: 更新内容（仅更新非None字段）
    
    **前端对应**: MainWorkspace.tsx 轮询更新视频状态
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
        
        # 更新视频字段（仅更新非None字段）
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
        
        print(f"[视频更新] 视频 {video_id} 更新: 状态={req.status}, 进度={req.progress}")
        
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
        print(f"[视频更新] 更新视频 {video_id} 失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/videos/{video_id}")
async def delete_user_video(video_id: str, db: Session = Depends(get_db)):
    """
    删除用户视频
    
    注意：
    - 仅删除数据库记录
    - 不删除TOS上的视频文件
    
    Args:
        video_id: 视频ID
    
    **前端对应**: UserCenter.tsx 删除视频功能
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
        
        video_title = video.product_name or '未命名'
        db.delete(video)
        db.commit()
        
        print(f"[视频删除] 删除视频: {video_id} ({video_title})")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[视频删除] 删除视频 {video_id} 失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ======================
# 公开视频接口
# ======================

@router.get("/public-videos")
async def get_public_videos(db: Session = Depends(get_db)):
    """
    获取所有公开的视频（内容广场）
    
    返回：
        - videos: 公开视频列表
    
    **前端对应**: 内容广场页面
    """
    try:
        public_videos = db.query(Video).filter(
            Video.is_public == True
        ).order_by(Video.created_at.desc()).all()
        
        return {
            "videos": [
                {
                    "id": v.id,
                    "url": v.video_url,
                    "thumbnail": v.thumbnail_url,
                    "script": v.script,
                    "productName": v.product_name,
                    "category": v.product_category,
                    "createdAt": v.created_at.timestamp() * 1000 if v.created_at else None,
                    "status": v.status,
                    "isPublic": v.is_public
                }
                for v in public_videos
            ]
        }
    except Exception as e:
        print(f"[公开视频] 获取公开视频列表失败: {e}")
        import traceback
        traceback.print_exc()
        return {"videos": []}
