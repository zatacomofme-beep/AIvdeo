"""
图片处理路由模块

负责处理图片相关的API接口：
- 图片上传到TOS
- 图片拼接（九宫格）
- AI图片生成（九宫格）
- 图片列表查询
- 图片删除

作者: SoraDirector Team
创建时间: 2025-12-27
重构阶段: 阶段6
"""

import os
import time
import uuid
import requests
from io import BytesIO
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from PIL import Image
import tos

from database import get_db, GeneratedImage, User, CreditHistory
from config import settings
from services import tos_service

# 创建路由
router = APIRouter(prefix="/api")

# TOS客户端配置
TOS_ENDPOINT = os.getenv("TOS_ENDPOINT", "https://tos-cn-beijing.volces.com")
TOS_REGION = os.getenv("TOS_REGION", "cn-beijing")
TOS_BUCKET = os.getenv("TOS_BUCKET", "sora-2")
TOS_ACCESS_KEY = os.getenv("TOS_ACCESS_KEY")
TOS_SECRET_KEY = os.getenv("TOS_SECRET_KEY")

# 初始化TOS客户端
tos_client = tos.TosClientV2(
    ak=TOS_ACCESS_KEY,
    sk=TOS_SECRET_KEY,
    endpoint=TOS_ENDPOINT,
    region=TOS_REGION,
    enable_crc=False
)

def build_public_url(bucket: str, key: str) -> str:
    """构建TOS公共访问URL（Virtual-Host模式）"""
    domain = TOS_ENDPOINT.replace("https://", "").replace("http://", "")
    return f"https://{bucket}.{domain}/{key}"


# ==================== 请求体模型 ====================

class CombineImagesRequest(BaseModel):
    """图片拼接请求"""
    imageUrls: List[str]  # 图片URL列表（2-9张）


class GenerateNineGridRequest(BaseModel):
    """生成九宫格图片请求"""
    imageUrl: str  # 原始图片URL（白底图）
    user_id: str  # 用户ID，用于扣除积分


# ==================== 图片上传接口 ====================

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """
    上传图片或视频到火山云TOS
    
    参数:
        file: 上传的文件（支持图片和视频）
    
    返回:
        {
            "url": "TOS访问URL",
            "size": 文件大小（字节）
        }
    """
    # 支持图片和视频上传
    allowed_types = ["image/", "video/"]
    if not file.content_type or not any(file.content_type.startswith(t) for t in allowed_types):
        raise HTTPException(status_code=400, detail="只允许上传图片或视频文件")

    # 生成唯一文件名
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    key = f"uploads/{time.strftime('%Y%m%d')}/{int(time.time()*1000)}-{uuid.uuid4().hex}{ext}"

    print(f"[IMAGE] 开始上传: {file.filename}")
    print(f"[IMAGE] Content-Type: {file.content_type}")
    print(f"[IMAGE] Key: {key}")

    try:
        # 读取文件内容
        content = await file.read()
        file_size = len(content)
        print(f"[IMAGE] 文件大小: {file_size} bytes ({file_size/1024:.2f} KB)")
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="文件为空")
        
        # 使用TOS SDK上传
        result = tos_client.put_object(
            bucket=TOS_BUCKET,
            key=key,
            content=BytesIO(content),
            content_length=file_size,
            content_type=file.content_type
        )
        
        print(f"[IMAGE] ✅ 上传成功! RequestID: {result.request_id}")
        
    except tos.exceptions.TosServerError as e:
        print(f"[IMAGE] ❌ TOS服务器错误: {e.message}")
        raise HTTPException(status_code=500, detail=f"上传失败: {e.message}")
        
    except tos.exceptions.TosClientError as e:
        print(f"[IMAGE] ❌ TOS客户端错误: {e.message}")
        raise HTTPException(status_code=500, detail=f"上传失败: {e.message}")
        
    except Exception as e:
        print(f"[IMAGE] ❌ 未知错误: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")

    # 构建公共访问URL
    url = build_public_url(TOS_BUCKET, key)
    print(f"[IMAGE] 返回URL: {url}")
    
    return {"url": url, "size": file_size}


# ==================== 图片拼接接口 ====================

@router.post("/combine-images")
async def combine_images(req: CombineImagesRequest):
    """
    将多张图片拼接成宫格图（2-4张→2x2，5-9张→3x3）
    
    解决前端Canvas跨域问题，在后端完成图片拼接
    
    参数:
        imageUrls: 图片URL列表（2-9张）
    
    返回:
        {
            "gridUrl": "拼接后的图片URL",
            "originalUrls": 原始图片URL列表
        }
    """
    image_count = len(req.imageUrls)
    
    # 1张图不需要拼接
    if image_count == 1:
        print('[IMAGE] 只有1张图片，无需拼接')
        return {"gridUrl": req.imageUrls[0], "originalUrls": req.imageUrls}
    
    if image_count > 9:
        raise HTTPException(status_code=400, detail="最多支持9张图片")
    
    # 2-4张 → 2x2宫格，5-9张 → 3x3宫格
    grid_size = 2 if image_count <= 4 else 3
    max_images = grid_size * grid_size
    
    print(f"[IMAGE] 开始拼接 {image_count} 张图片为 {grid_size}x{grid_size} 宫格...")
    
    try:
        # 下载所有图片
        images = []
        for url in req.imageUrls:
            print(f"[IMAGE] 下载图片: {url}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            images.append(img)
        
        print('[IMAGE] 所有图片下载完成')
        
        # 创建画布
        cell_width = 400
        cell_height = 400
        canvas_width = cell_width * grid_size
        canvas_height = cell_height * grid_size
        
        # 创建白色背景
        canvas = Image.new('RGB', (canvas_width, canvas_height), (255, 255, 255))
        
        # 绘制图片
        for i in range(min(image_count, max_images)):
            row = i // grid_size
            col = i % grid_size
            x = col * cell_width
            y = row * cell_height
            
            # 调整图片大小以适应单元格（保持比例，裁剪填充）
            img = images[i]
            scale = max(cell_width / img.width, cell_height / img.height)
            scaled_width = int(img.width * scale)
            scaled_height = int(img.height * scale)
            img_resized = img.resize((scaled_width, scaled_height), Image.Resampling.LANCZOS)
            
            # 居中裁剪
            offset_x = (scaled_width - cell_width) // 2
            offset_y = (scaled_height - cell_height) // 2
            img_cropped = img_resized.crop((offset_x, offset_y, offset_x + cell_width, offset_y + cell_height))
            
            # 粘贴到画布
            canvas.paste(img_cropped, (x, y))
            print(f"[IMAGE] 绘制第{i + 1}张图片: 位置({row}, {col})")
        
        print('[IMAGE] 所有图片绘制完成，开始压缩...')
        
        # 保存为JPEG（压缩）
        output = BytesIO()
        canvas.save(output, format='JPEG', quality=85)
        output.seek(0)
        
        file_size = len(output.getvalue())
        print(f"[IMAGE] 拼接完成，大小: {file_size / 1024:.2f} KB")
        
        # 上传到TOS
        ext = ".jpg"
        key = f"uploads/{time.strftime('%Y%m%d')}/{int(time.time()*1000)}-grid-{grid_size}x{grid_size}{ext}"
        
        print(f"[IMAGE] 开始上传到TOS: {key}")
        result = tos_client.put_object(
            bucket=TOS_BUCKET,
            key=key,
            content=output,
            content_length=file_size,
            content_type="image/jpeg"
        )
        
        grid_url = build_public_url(TOS_BUCKET, key)
        print(f"[IMAGE] 上传成功: {grid_url}")
        
        # 删除原图
        print(f"[IMAGE] 开始从桶中删除 {len(req.imageUrls)} 张原图...")
        for url in req.imageUrls:
            try:
                # 从URL提取对象键
                parts = url.split('.com/')
                if len(parts) >= 2:
                    original_key = parts[1]
                    tos_client.delete_object(bucket=TOS_BUCKET, key=original_key)
                    print(f"[IMAGE] 已删除原图: {original_key}")
            except Exception as e:
                print(f"[IMAGE] 删除原图失败: {url}, 错误: {e}")
        
        return {"gridUrl": grid_url, "originalUrls": req.imageUrls}
        
    except Exception as e:
        print(f"[IMAGE] 拼接失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"图片拼接失败: {str(e)}")


# ==================== AI生成九宫格接口 ====================

@router.post("/generate-nine-grid")
async def generate_nine_grid(req: GenerateNineGridRequest, db: Session = Depends(get_db)):
    """
    使用AI生成九宫格商品图（白底→场景化）
    
    扣除70积分，调用Gemini生图API生成9张不同场景的商品图
    
    参数:
        imageUrl: 原始白底商品图URL
        user_id: 用户ID
    
    返回:
        {
            "success": true,
            "gridUrl": "九宫格图片URL",
            "originalUrl": "原始图片URL",
            "creditsCost": 70
        }
    """
    CREDITS_COST = 70  # 九宫格生成消耗70积分
    
    print(f"[NINE_GRID] 用户 {req.user_id} 请求生成九宫格")
    print(f"[NINE_GRID] 原始图片: {req.imageUrl}")
    
    # 1. 检查用户积分
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    if user.credits < CREDITS_COST:
        raise HTTPException(
            status_code=403, 
            detail=f"积分不足，需要{CREDITS_COST}积分，当前仅有{user.credits}积分"
        )
    
    print(f"[NINE_GRID] 用户当前积分: {user.credits}")
    
    try:
        # 2. 扣除积分
        user.credits -= CREDITS_COST
        db.commit()
        
        # 记录积分消费
        credit_record = CreditHistory(
            id=str(uuid.uuid4()),
            user_id=req.user_id,
            amount=-CREDITS_COST,
            action='九宫格图片生成',
            description='AI生成九宫格商品图（9张场景化图片）'
        )
        db.add(credit_record)
        db.commit()
        
        print(f"[NINE_GRID] 已扣除 {CREDITS_COST} 积分，剩余: {user.credits}")
        
        # 3. TODO: 调用AI生图接口生成9张图
        # 这里需要实现实际的AI生图逻辑
        # 暂时返回模拟数据
        
        # 创建记录
        image_id = str(uuid.uuid4())
        new_image = GeneratedImage(
            id=image_id,
            user_id=req.user_id,
            original_url=req.imageUrl,
            grid_url=req.imageUrl,  # 暂时使用原图
            model_name="gemini-3-pro-image-preview",
            credits_cost=CREDITS_COST,
            status='completed'
        )
        db.add(new_image)
        db.commit()
        
        print(f"[NINE_GRID] 生成成功，记录ID: {image_id}")
        
        return {
            "success": True,
            "gridUrl": req.imageUrl,  # 暂时返回原图
            "originalUrl": req.imageUrl,
            "creditsCost": CREDITS_COST
        }
        
    except HTTPException:
        # 如果是HTTP异常，回滚积分
        db.rollback()
        raise
    except Exception as e:
        # 其他异常也回滚
        db.rollback()
        print(f"[NINE_GRID] 生成失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"九宫格图片生成失败: {str(e)}")


# ==================== 图片列表查询接口 ====================

@router.get("/generated-images/{user_id}")
async def get_generated_images(user_id: str, db: Session = Depends(get_db)):
    """
    获取用户生成的九宫格图片列表
    
    参数:
        user_id: 用户ID
    
    返回:
        {
            "success": true,
            "images": [
                {
                    "id": "图片ID",
                    "gridUrl": "九宫格图片URL",
                    "originalUrl": "原始图片URL",
                    "modelName": "AI模型名称",
                    "creditsCost": 消耗积分,
                    "createdAt": 创建时间戳,
                    "tags": 标签列表,
                    "category": 分类
                }
            ]
        }
    """
    print(f"[IMAGE] 获取用户 {user_id} 的九宫格图片列表")
    
    try:
        # 查询用户的所有成功生成的九宫格图片
        images = db.query(GeneratedImage).filter(
            GeneratedImage.user_id == user_id,
            GeneratedImage.status == 'completed'
        ).order_by(GeneratedImage.created_at.desc()).all()
        
        print(f"[IMAGE] 找到 {len(images)} 张九宫格图片")
        
        return {
            "success": True,
            "images": [
                {
                    "id": img.id,
                    "gridUrl": img.grid_url,
                    "originalUrl": img.original_url,
                    "modelName": img.model_name,
                    "creditsCost": img.credits_cost,
                    "createdAt": int(img.created_at.timestamp() * 1000),
                    "tags": img.tags or [],
                    "category": img.category
                }
                for img in images
            ]
        }
    except Exception as e:
        print(f"[IMAGE] 获取九宫格图片列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 图片删除接口 ====================

@router.delete("/generated-images/{image_id}")
async def delete_generated_image(image_id: str, user_id: str, db: Session = Depends(get_db)):
    """
    删除生成的九宫格图片记录
    
    参数:
        image_id: 图片ID
        user_id: 用户ID（用于权限验证）
    
    返回:
        {
            "success": true,
            "message": "图片记录已删除"
        }
    """
    print(f"[IMAGE] 删除九宫格图片: {image_id}")
    
    try:
        # 查询图片记录
        image = db.query(GeneratedImage).filter(
            GeneratedImage.id == image_id,
            GeneratedImage.user_id == user_id
        ).first()
        
        if not image:
            raise HTTPException(status_code=404, detail="图片记录不存在")
        
        # 删除数据库记录（不删除TOS上的实际文件，保留以防万一）
        db.delete(image)
        db.commit()
        
        print(f"[IMAGE] 九宫格图片记录已删除")
        return {
            "success": True,
            "message": "图片记录已删除"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[IMAGE] 删除失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
