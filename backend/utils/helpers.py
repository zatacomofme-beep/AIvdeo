"""
辅助工具函数
"""

from datetime import datetime
from typing import Optional


def build_public_url(bucket: str, key: str, endpoint: str = "tos-cn-beijing.volces.com") -> str:
    """
    构建火山云TOS的公开访问URL（Virtual-Host模式）
    
    Args:
        bucket: 存储桶名称
        key: 对象键（文件路径）
        endpoint: TOS端点（不含https://前缀）
    
    Returns:
        完整的公开访问URL
    
    Example:
        >>> build_public_url("my-bucket", "uploads/image.jpg")
        'https://my-bucket.tos-cn-beijing.volces.com/uploads/image.jpg'
    """
    # 移除endpoint中的https://前缀
    clean_endpoint = endpoint.replace("https://", "").replace("http://", "")
    
    # Virtual-Host格式: https://{bucket}.{endpoint}/{key}
    return f"https://{bucket}.{clean_endpoint}/{key}"


def format_timestamp(timestamp: Optional[float]) -> Optional[int]:
    """
    将时间戳转换为毫秒格式（前端使用）
    
    Args:
        timestamp: Python时间戳（秒）
    
    Returns:
        毫秒时间戳，如果输入为None则返回None
    
    Example:
        >>> format_timestamp(1609459200.0)
        1609459200000
    """
    if timestamp is None:
        return None
    return int(timestamp * 1000)


def get_file_extension(filename: str) -> str:
    """
    获取文件扩展名
    
    Args:
        filename: 文件名
    
    Returns:
        扩展名（包含点号），如果没有扩展名则返回空字符串
    
    Example:
        >>> get_file_extension("image.jpg")
        '.jpg'
        >>> get_file_extension("document")
        ''
    """
    import os
    return os.path.splitext(filename)[1]


def sanitize_filename(filename: str) -> str:
    """
    清理文件名，移除不安全的字符
    
    Args:
        filename: 原始文件名
    
    Returns:
        清理后的安全文件名
    
    Example:
        >>> sanitize_filename("../../../etc/passwd")
        'etcpasswd'
    """
    import re
    # 移除路径分隔符和特殊字符
    safe_name = re.sub(r'[^\w\s.-]', '', filename)
    # 移除开头的点号（隐藏文件）
    safe_name = safe_name.lstrip('.')
    return safe_name


def validate_file_size(file_size: int, max_size_mb: int = 10) -> bool:
    """
    验证文件大小是否在允许范围内
    
    Args:
        file_size: 文件大小（字节）
        max_size_mb: 最大允许大小（MB）
    
    Returns:
        True表示文件大小合法
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_size_bytes


def generate_unique_key(prefix: str = "uploads", extension: str = "") -> str:
    """
    生成唯一的对象键（用于TOS存储）
    
    Args:
        prefix: 前缀路径
        extension: 文件扩展名（包含点号）
    
    Returns:
        唯一的对象键
    
    Example:
        >>> generate_unique_key("images", ".jpg")
        'images/20231225/1703491200000-a1b2c3d4.jpg'
    """
    import time
    import uuid
    from datetime import datetime
    
    date_str = datetime.now().strftime("%Y%m%d")
    timestamp = int(time.time() * 1000)
    unique_id = uuid.uuid4().hex[:8]
    
    return f"{prefix}/{date_str}/{timestamp}-{unique_id}{extension}"
