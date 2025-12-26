"""
火山云TOS存储服务
处理文件上传、删除等操作
"""

import tos
from io import BytesIO
from typing import Optional
from fastapi import HTTPException

from config import settings
from utils.helpers import build_public_url


class TOSService:
    """火山云TOS存储服务类"""
    
    def __init__(self):
        """初始化TOS客户端"""
        if not settings.TOS_ACCESS_KEY or not settings.TOS_SECRET_KEY:
            raise ValueError("TOS_ACCESS_KEY 或 TOS_SECRET_KEY 未配置")
        
        self.client = tos.TosClientV2(
            ak=settings.TOS_ACCESS_KEY,
            sk=settings.TOS_SECRET_KEY,
            endpoint=settings.TOS_ENDPOINT,
            region=settings.TOS_REGION,
            enable_crc=False
        )
        
        self.bucket = settings.TOS_BUCKET
        self.endpoint = settings.TOS_ENDPOINT.replace("https://", "")
        
        print(f"[TOS Service] 初始化成功")
        print(f"[TOS Service] Bucket: {self.bucket}")
        print(f"[TOS Service] Region: {settings.TOS_REGION}")
    
    def upload_file(
        self, 
        key: str, 
        content: bytes | BytesIO, 
        content_type: str,
        content_length: Optional[int] = None
    ) -> str:
        """
        上传文件到TOS
        
        Args:
            key: 对象键（文件路径）
            content: 文件内容（字节或BytesIO对象）
            content_type: 文件MIME类型
            content_length: 文件大小（字节），如果提供BytesIO则可选
        
        Returns:
            文件的公开访问URL
        
        Raises:
            HTTPException: 上传失败时抛出
        """
        try:
            # 如果是bytes，转换为BytesIO
            if isinstance(content, bytes):
                file_size = len(content)
                content = BytesIO(content)
            else:
                file_size = content_length or len(content.getvalue())
            
            print(f"[TOS] 上传文件: {key} ({file_size} bytes)")
            
            # 调用TOS SDK上传
            result = self.client.put_object(
                bucket=self.bucket,
                key=key,
                content=content,
                content_length=file_size,
                content_type=content_type
            )
            
            print(f"[TOS] ✅ 上传成功 RequestID: {result.request_id}")
            
            # 构建公开访问URL
            url = build_public_url(self.bucket, key, self.endpoint)
            return url
            
        except tos.exceptions.TosServerError as e:
            print(f"[TOS] ❌ 服务器错误")
            print(f"  Status: {e.status_code}")
            print(f"  Code: {e.code}")
            print(f"  Message: {e.message}")
            raise HTTPException(status_code=500, detail=f"上传失败: {e.message}")
            
        except tos.exceptions.TosClientError as e:
            print(f"[TOS] ❌ 客户端错误: {e.message}")
            raise HTTPException(status_code=500, detail=f"上传失败: {e.message}")
            
        except Exception as e:
            print(f"[TOS] ❌ 未知错误: {type(e).__name__}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")
    
    def delete_file(self, url: str) -> bool:
        """
        从TOS删除文件
        
        Args:
            url: 文件的完整URL
        
        Returns:
            是否删除成功
        """
        try:
            # 从URL提取对象键
            parts = url.split('.com/')
            if len(parts) < 2:
                print(f"[TOS] ⚠️ 无效的URL格式: {url}")
                return False
            
            object_key = parts[1]
            
            print(f"[TOS] 删除文件: {object_key}")
            self.client.delete_object(bucket=self.bucket, key=object_key)
            print(f"[TOS] ✅ 删除成功")
            return True
            
        except Exception as e:
            print(f"[TOS] ❌ 删除失败: {str(e)}")
            return False
    
    def get_file_url(self, key: str) -> str:
        """
        获取文件的公开访问URL
        
        Args:
            key: 对象键
        
        Returns:
            公开访问URL
        """
        return build_public_url(self.bucket, key, self.endpoint)


# 创建全局TOS服务实例
try:
    tos_service = TOSService()
except Exception as e:
    print(f"⚠️ TOS服务初始化失败: {e}")
    tos_service = None
