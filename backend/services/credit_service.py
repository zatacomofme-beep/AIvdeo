"""
积分服务
处理用户积分的扣除、充值、查询等操作
"""

import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException

from config import settings
from database import User, CreditHistory


class CreditService:
    """积分服务类"""
    
    @staticmethod
    def get_user_credits(user_id: str, db: Session) -> int:
        """
        获取用户当前积分
        
        Args:
            user_id: 用户ID
            db: 数据库会话
        
        Returns:
            用户当前积分数
        
        Raises:
            HTTPException: 用户不存在
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        return user.credits
    
    @staticmethod
    def deduct_credits(
        user_id: str,
        amount: int,
        action: str,
        description: str,
        db: Session
    ) -> dict:
        """
        扣除用户积分
        
        Args:
            user_id: 用户ID
            amount: 扣除数量（正数）
            action: 操作类型（如 "generate_video"）
            description: 操作描述
            db: 数据库会话
        
        Returns:
            包含扣除后余额的字典
        
        Raises:
            HTTPException: 用户不存在或积分不足
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        if user.credits < amount:
            raise HTTPException(
                status_code=400,
                detail=f"积分不足，当前积分：{user.credits}，需要：{amount}"
            )
        
        # 扣除积分
        old_credits = user.credits
        user.credits -= amount
        
        # 记录积分历史
        credit_history = CreditHistory(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            amount=-amount,  # 负数表示扣除
            balance_after=user.credits,
            description=description
        )
        db.add(credit_history)
        db.commit()
        
        print(f"[Credit] 用户 {user_id} 扣除 {amount} 积分: {old_credits} -> {user.credits}")
        
        return {
            "success": True,
            "old_balance": old_credits,
            "new_balance": user.credits,
            "amount": amount
        }
    
    @staticmethod
    def add_credits(
        user_id: str,
        amount: int,
        action: str,
        description: str,
        db: Session
    ) -> dict:
        """
        增加用户积分
        
        Args:
            user_id: 用户ID
            amount: 增加数量（正数）
            action: 操作类型（如 "recharge"）
            description: 操作描述
            db: 数据库会话
        
        Returns:
            包含增加后余额的字典
        
        Raises:
            HTTPException: 用户不存在
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 增加积分
        old_credits = user.credits
        user.credits += amount
        
        # 记录积分历史
        credit_history = CreditHistory(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            amount=amount,  # 正数表示增加
            balance_after=user.credits,
            description=description
        )
        db.add(credit_history)
        db.commit()
        
        print(f"[Credit] 用户 {user_id} 增加 {amount} 积分: {old_credits} -> {user.credits}")
        
        return {
            "success": True,
            "old_balance": old_credits,
            "new_balance": user.credits,
            "amount": amount
        }
    
    @staticmethod
    def check_sufficient_credits(user_id: str, required_amount: int, db: Session) -> bool:
        """
        检查用户积分是否足够
        
        Args:
            user_id: 用户ID
            required_amount: 需要的积分数
            db: 数据库会话
        
        Returns:
            是否足够
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        return user.credits >= required_amount
    
    @staticmethod
    def get_credit_history(user_id: str, db: Session, limit: int = 50) -> list:
        """
        获取用户积分历史记录
        
        Args:
            user_id: 用户ID
            db: 数据库会话
            limit: 返回记录数量限制
        
        Returns:
            积分历史记录列表
        """
        history = db.query(CreditHistory).filter(
            CreditHistory.user_id == user_id
        ).order_by(
            CreditHistory.created_at.desc()
        ).limit(limit).all()
        
        return [
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


# 创建全局积分服务实例
credit_service = CreditService()
