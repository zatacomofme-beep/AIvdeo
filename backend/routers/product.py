"""
商品管理路由模块

提供商品相关功能：
- 商品创建和更新
- 商品列表查询
- 商品详情查看
- 商品删除
"""
from typing import Optional, List
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, Product


router = APIRouter(prefix="/api", tags=["Product Management"])


# ======================
# Pydantic 数据模型
# ======================

class CreateProductRequest(BaseModel):
    """创建商品请求"""
    user_id: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    images: Optional[List[str]] = []
    selling_points: Optional[List[str]] = []


class UpdateProductRequest(BaseModel):
    """更新商品请求"""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    images: Optional[List[str]] = None
    specs: Optional[dict] = None
    selling_points: Optional[List[str]] = None


# ======================
# 商品管理接口
# ======================

@router.post("/products")
async def create_product(req: CreateProductRequest, db: Session = Depends(get_db)):
    """
    创建商品
    
    Args:
        req: 商品信息
            - user_id: 用户ID
            - name: 商品名称
            - description: 商品描述
            - category: 商品类目
            - images: 商品图片URL列表
            - selling_points: 卖点列表
    
    返回：
        - success: 是否成功
        - product: 商品信息
    
    **前端对应**: 商品管理页面
    """
    try:
        product_id = str(uuid.uuid4())
        
        # 将 selling_points 列表转换为文本（用逗号分隔）
        selling_points_text = ', '.join(req.selling_points) if req.selling_points else ''
        
        new_product = Product(
            id=product_id,
            user_id=req.user_id,
            name=req.name,
            usage=req.description,  # description 映射到 usage 字段
            category=req.category,
            selling_points=selling_points_text,
            image_urls=req.images
        )
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        
        # 返回时转换回列表格式
        selling_points_list = selling_points_text.split(', ') if selling_points_text else []
        
        print(f"[商品创建] 用户 {req.user_id} 创建商品: {product_id} ({req.name})")
        
        return {
            "success": True,
            "product": {
                "id": new_product.id,
                "name": new_product.name,
                "description": new_product.usage,
                "category": new_product.category,
                "images": new_product.image_urls,
                "sellingPoints": selling_points_list,
                "createdAt": new_product.created_at.timestamp() * 1000 if new_product.created_at else None
            }
        }
    except Exception as e:
        db.rollback()
        print(f"[商品创建] 创建商品失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/products/{user_id}")
async def get_user_products(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户的所有商品
    
    Args:
        user_id: 用户ID
    
    返回：
        - products: 商品列表（按创建时间倒序）
    """
    try:
        products = db.query(Product).filter(
            Product.user_id == user_id
        ).order_by(Product.created_at.desc()).all()
        
        return {
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "usage": p.usage,
                    "sellingPoints": p.selling_points,
                    "imageUrls": p.image_urls,
                    "createdAt": p.created_at.timestamp() * 1000 if p.created_at else None,
                    "updatedAt": p.updated_at.timestamp() * 1000 if p.updated_at else None
                }
                for p in products
            ]
        }
    except Exception as e:
        print(f"[商品列表] 获取用户 {user_id} 商品列表失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/product/{product_id}")
async def get_product_detail(product_id: str, db: Session = Depends(get_db)):
    """
    获取单个商品详情
    
    Args:
        product_id: 商品ID
    
    返回：
        商品详细信息
    """
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="商品不存在")
        
        return {
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "usage": product.usage,
            "sellingPoints": product.selling_points,
            "imageUrls": product.image_urls,
            "createdAt": product.created_at.timestamp() * 1000 if product.created_at else None,
            "updatedAt": product.updated_at.timestamp() * 1000 if product.updated_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[商品详情] 获取商品 {product_id} 详情失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/product/{product_id}")
async def update_product(
    product_id: str, 
    req: UpdateProductRequest, 
    db: Session = Depends(get_db)
):
    """
    更新商品信息
    
    Args:
        product_id: 商品ID
        req: 更新内容（仅更新非None字段）
    """
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="商品不存在")
        
        # 更新字段（仅更新非None字段）
        if req.name is not None:
            product.name = req.name
        if req.description is not None:
            product.description = req.description
        if req.category is not None:
            product.category = req.category
        if req.price is not None:
            product.price = req.price
        if req.images is not None:
            product.images = req.images
        if req.specs is not None:
            product.specs = req.specs
        if req.selling_points is not None:
            product.selling_points = req.selling_points
        
        db.commit()
        db.refresh(product)
        
        print(f"[商品更新] 商品 {product_id} 更新成功")
        
        return {
            "success": True,
            "product": {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "category": product.category,
                "price": product.price,
                "images": product.images,
                "specs": product.specs,
                "sellingPoints": product.selling_points,
                "updatedAt": product.updated_at.timestamp() * 1000 if product.updated_at else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[商品更新] 更新商品 {product_id} 失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/product/{product_id}")
async def delete_product(product_id: str, db: Session = Depends(get_db)):
    """
    删除商品
    
    Args:
        product_id: 商品ID
    """
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="商品不存在")
        
        product_name = product.name
        db.delete(product)
        db.commit()
        
        print(f"[商品删除] 删除商品: {product_id} ({product_name})")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[商品删除] 删除商品 {product_id} 失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
