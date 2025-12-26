"""
健康检查路由（示例）
演示新架构的使用方式
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db, test_connection
from config import settings
from services import tos_service, ai_service

router = APIRouter(prefix="/api/health", tags=["健康检查"])


@router.get("")
async def health_check():
    """
    健康检查接口
    返回服务状态信息
    """
    return {
        "status": "healthy",
        "service": "SoraDirector Backend",
        "version": "2.0.0-refactored",
        "config": {
            "tos_bucket": settings.TOS_BUCKET,
            "llm_model": settings.LLM_MODEL_NAME,
            "video_model": settings.VIDEO_MODEL_NAME,
            "api_key_pool_size": len(settings.get_api_key_pool()),
            "credits_per_video": settings.CREDITS_PER_VIDEO
        }
    }


@router.get("/database")
async def check_database(db: Session = Depends(get_db)):
    """
    检查数据库连接
    """
    try:
        # 测试数据库连接
        test_connection()
        return {
            "status": "connected",
            "message": "数据库连接正常"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"数据库连接失败: {str(e)}"
        }


@router.get("/services")
async def check_services():
    """
    检查各个服务状态
    """
    services_status = {}
    
    # 检查TOS服务
    if tos_service:
        services_status["tos"] = {
            "status": "available",
            "bucket": tos_service.bucket,
            "region": settings.TOS_REGION
        }
    else:
        services_status["tos"] = {
            "status": "unavailable",
            "error": "TOS服务未初始化"
        }
    
    # 检查AI服务
    services_status["ai"] = {
        "status": "available",
        "llm_available": ai_service.llm_client is not None,
        "video_api_pool_size": ai_service.video_api_pool.size()
    }
    
    return {
        "services": services_status
    }
