"""
项目管理路由模块

负责处理项目相关的API接口：
- 创建项目
- 获取用户项目列表

作者: SoraDirector Team
创建时间: 2025-12-27
重构阶段: 阶段5
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from database import get_db, Project

# 创建路由
router = APIRouter(prefix="/api")

# ==================== 请求体模型 ====================

class CreateProjectRequest(BaseModel):
    """创建项目请求体"""
    user_id: str
    product_name: str
    product_description: str

# ==================== 项目管理接口 ====================

@router.post("/projects")
async def create_project(req: CreateProjectRequest, db: Session = Depends(get_db)):
    """
    创建项目
    
    参数:
        req: 项目创建请求
        - user_id: 用户ID
        - product_name: 产品名称
        - product_description: 产品描述
    
    返回:
        {
            "success": true,
            "project": {
                "id": "项目ID",
                "productName": "产品名称",
                "productDescription": "产品描述",
                "status": "draft",
                "createdAt": 时间戳
            }
        }
    """
    try:
        project_id = str(uuid.uuid4())
        new_project = Project(
            id=project_id,
            user_id=req.user_id,
            product_name=req.product_name,
            product_description=req.product_description,
            status='draft'
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        
        return {
            "success": True,
            "project": {
                "id": new_project.id,
                "productName": new_project.product_name,
                "productDescription": new_project.product_description,
                "status": new_project.status,
                "createdAt": new_project.created_at.timestamp() * 1000 if new_project.created_at else None
            }
        }
    except Exception as e:
        db.rollback()
        print(f"[PROJECT] ❌ 创建项目失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{user_id}")
async def get_user_projects(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户的所有项目
    
    参数:
        user_id: 用户ID
    
    返回:
        {
            "projects": [
                {
                    "id": "项目ID",
                    "productName": "产品名称",
                    "productDescription": "产品描述",
                    "status": "状态",
                    "createdAt": 创建时间戳,
                    "updatedAt": 更新时间戳
                }
            ]
        }
    """
    try:
        projects = db.query(Project).filter(
            Project.user_id == user_id
        ).order_by(Project.created_at.desc()).all()
        
        return {
            "projects": [
                {
                    "id": p.id,
                    "productName": p.product_name,
                    "productDescription": p.product_description,
                    "status": p.status,
                    "createdAt": p.created_at.timestamp() * 1000 if p.created_at else None,
                    "updatedAt": p.updated_at.timestamp() * 1000 if p.updated_at else None
                }
                for p in projects
            ]
        }
    except Exception as e:
        print(f"[PROJECT] ❌ 获取项目列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
