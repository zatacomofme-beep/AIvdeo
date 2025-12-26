"""
管理员路由模块

提供管理员专用功能：
- 平台统计数据
- 用户管理（含付费数据统计）
- 视频管理
- 提示词管理
- 积分调整
"""
from typing import Optional
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, User, Video, SavedPrompt, CreditHistory


router = APIRouter(prefix="/api/admin", tags=["Admin Management"])


# ======================
# Pydantic 数据模型
# ======================

class UpdateCreditsRequest(BaseModel):
    """更新用户积分请求"""
    credits: int


class ToggleVideoPublicRequest(BaseModel):
    """切换视频公开状态请求"""
    isPublic: bool


# ======================
# 平台统计接口
# ======================

@router.get("/stats")
async def get_admin_stats(db: Session = Depends(get_db)):
    """
    获取平台统计数据
    
    返回：
    - totalUsers: 总用户数
    - totalVideos: 总视频数
    - publicVideos: 公开视频数
    - totalCreditsUsed: 总消费积分
    - totalRecharge: 总充值金额（积分）
    
    **权限要求**: 管理员
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
        print(f"[管理员统计] 获取统计数据失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ======================
# 用户管理接口
# ======================

@router.get("/users")
async def get_admin_users(db: Session = Depends(get_db)):
    """
    获取所有用户列表（包括付费数据）
    
    返回数据包含：
    - 用户基本信息（ID、邮箱、积分、角色）
    - 付费数据统计：
      * totalRecharge: 总充值金额（积分）
      * rechargeCount: 充值次数
      * totalConsume: 总消费积分
    
    **权限要求**: 管理员
    
    **前端对应**: AdminPanel.tsx 用户管理表格
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
        print(f"[管理员用户] 获取用户列表失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/user/{user_id}/credits")
async def update_user_credits(
    user_id: str, 
    req: UpdateCreditsRequest, 
    db: Session = Depends(get_db)
):
    """
    手动调整用户积分
    
    Args:
        user_id: 用户ID
        req.credits: 新的积分余额
    
    功能：
    - 修改用户积分
    - 记录积分变动历史
    - 生成调整说明
    
    **权限要求**: 管理员
    
    **前端对应**: AdminPanel.tsx 用户管理 - 积分调整功能
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
        
        print(f"[管理员积分] 用户 {user.email} 积分调整: {old_credits} -> {req.credits}")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[管理员积分] 更新用户积分失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ======================
# 提示词管理接口
# ======================

@router.get("/prompts")
async def get_admin_prompts(
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db)
):
    """
    获取所有提示词（分页）
    
    Args:
        page: 页码（从1开始）
        page_size: 每页数量（默认50条）
    
    返回：
    - prompts: 提示词列表
    - total: 总数量
    - page: 当前页码
    - page_size: 每页数量
    
    **权限要求**: 管理员
    
    **前端对应**: AdminPanel.tsx 提示词管理 - 列表样式+分页
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
        print(f"[管理员提示词] 获取提示词列表失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ======================
# 视频管理接口
# ======================

@router.get("/videos")
async def get_admin_videos(db: Session = Depends(get_db)):
    """
    获取所有视频列表
    
    返回：
    - 视频基本信息
    - 关联用户邮箱
    - 公开状态
    - 创建时间
    
    **权限要求**: 管理员
    
    **前端对应**: AdminPanel.tsx 视频管理列表
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
        print(f"[管理员视频] 获取视频列表失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/video/{video_id}/public")
async def toggle_video_public(
    video_id: str,
    request: ToggleVideoPublicRequest,
    db: Session = Depends(get_db)
):
    """
    切换视频公开状态
    
    Args:
        video_id: 视频ID
        request.isPublic: 是否公开
    
    功能：
    - 修改视频的公开/私密状态
    - 控制视频在内容广场的显示
    
    **权限要求**: 管理员
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
        
        old_status = video.is_public
        video.is_public = request.isPublic
        db.commit()
        
        print(f"[管理员视频] 视频 {video_id} 公开状态: {old_status} -> {request.isPublic}")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[管理员视频] 切换视频公开状态失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/video/{video_id}")
async def delete_video_admin(video_id: str, db: Session = Depends(get_db)):
    """
    删除视频
    
    Args:
        video_id: 视频ID
    
    注意：
    - 仅删除数据库记录
    - 不删除TOS上的视频文件
    
    **权限要求**: 管理员
    """
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="视频不存在")
        
        video_title = video.product_name or '未命名'
        db.delete(video)
        db.commit()
        
        print(f"[管理员视频] 删除视频: {video_id} ({video_title})")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[管理员视频] 删除视频失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
