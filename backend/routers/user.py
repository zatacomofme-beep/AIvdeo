"""
用户管理路由模块

提供用户注册、登录、信息查询等功能
"""
from typing import Optional
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, User, CreditHistory
from services.credit_service import CreditService
import bcrypt


router = APIRouter(prefix="/api", tags=["User Management"])


# ======================
# Pydantic 数据模型
# ======================

class RegisterRequest(BaseModel):
    """用户注册请求"""
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    """用户登录请求"""
    email: str
    password: str


class UserResponse(BaseModel):
    """用户信息响应"""
    id: str
    email: str
    username: str
    credits: int
    role: str
    createdAt: Optional[int] = None
    isActive: Optional[bool] = True


# ======================
# 密码加密工具函数
# ======================

def hash_password(password: str) -> str:
    """加密密码"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        print(f"[密码验证错误] {str(e)}")
        return False


# ======================
# 用户认证接口
# ======================

@router.post("/register")
async def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    用户注册
    
    - 检查邮箱是否已存在
    - 加密存储密码
    - 新用户赠送100积分
    - 记录积分历史
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
            password_hash=hashed_password,
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


@router.post("/login")
async def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    """
    用户登录
    
    - 验证邮箱和密码
    - 检查账号是否被禁用
    - 返回用户信息
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
# 用户信息接口
# ======================

@router.get("/user/{user_id}")
async def get_user_info(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户信息
    
    返回用户的基本信息，不包含密码
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


@router.get("/user/{user_id}/stats")
async def get_user_stats(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户统计数据
    
    返回：
    - videoCount: 视频数量
    - productCount: 商品数量
    - totalConsumed: 总消费积分
    """
    try:
        from database import Video, Product
        
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


# ======================
# 积分管理接口
# ======================

@router.get("/credits/{user_id}")
async def get_user_credits(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户积分余额
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        return {
            "userId": user_id,
            "credits": user.credits
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"获取积分余额失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/credits/history/{user_id}")
async def get_credit_history(user_id: str, db: Session = Depends(get_db)):
    """
    获取积分历史记录
    
    按时间倒序返回所有积分变动记录
    """
    try:
        history = db.query(CreditHistory).filter(
            CreditHistory.user_id == user_id
        ).order_by(CreditHistory.created_at.desc()).all()
        
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
