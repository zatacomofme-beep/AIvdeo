"""
API Key 轮询池管理
用于多个API Key的负载均衡和自动切换
"""

from typing import Optional


class APIKeyPool:
    """API Key轮询池"""
    
    def __init__(self, api_keys: list[str], fallback_key: Optional[str] = None):
        """
        初始化API Key池
        
        Args:
            api_keys: API Key列表
            fallback_key: 备用Key（当池为空时使用）
        """
        self.api_keys = api_keys
        self.fallback_key = fallback_key
        self.current_index = 0
        
        print(f"[API Key Pool] 初始化完成，共 {len(self.api_keys)} 个密钥")
    
    def get_next_key(self) -> str:
        """
        获取下一个API Key（轮询模式）
        
        Returns:
            下一个可用的API Key
        """
        if not self.api_keys:
            if self.fallback_key:
                return self.fallback_key
            raise ValueError("API Key池为空，且没有配置备用Key")
        
        key = self.api_keys[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.api_keys)
        return key
    
    def get_current_key(self) -> str:
        """
        获取当前API Key（不轮询）
        
        Returns:
            当前的API Key
        """
        if not self.api_keys:
            if self.fallback_key:
                return self.fallback_key
            raise ValueError("API Key池为空，且没有配置备用Key")
        
        return self.api_keys[self.current_index]
    
    def size(self) -> int:
        """返回池中的Key数量"""
        return len(self.api_keys)
    
    def reset(self) -> None:
        """重置索引到第一个Key"""
        self.current_index = 0
