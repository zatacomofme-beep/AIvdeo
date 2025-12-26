"""
AI服务
处理与AI模型的交互（LLM、视频生成等）
"""

from typing import Optional, List, Dict, Any
from openai import OpenAI

from config import settings
from utils.api_key_pool import APIKeyPool


class AIService:
    """AI服务类"""
    
    def __init__(self):
        """初始化AI客户端和API Key池"""
        # 初始化LLM客户端
        if settings.LLM_API_KEY:
            self.llm_client = OpenAI(
                api_key=settings.LLM_API_KEY,
                base_url=f"{settings.LLM_BASE_URL}/v1"
            )
            print(f"[AI Service] LLM客户端初始化成功")
        else:
            self.llm_client = None
            print(f"[AI Service] ⚠️ LLM_API_KEY未配置，聊天功能将不可用")
        
        # 初始化视频生成API Key池
        api_keys = settings.get_api_key_pool()
        self.video_api_pool = APIKeyPool(
            api_keys=api_keys,
            fallback_key=settings.VIDEO_API_KEY
        )
        
        print(f"[AI Service] 视频API Key池初始化: {self.video_api_pool.size()} 个密钥")
    
    def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        调用LLM进行对话
        
        Args:
            messages: 消息列表 [{"role": "user", "content": "..."}]
            model: 模型名称，默认使用配置中的模型
            temperature: 温度参数
            max_tokens: 最大token数
        
        Returns:
            AI的回复内容
        
        Raises:
            ValueError: LLM客户端未初始化
            Exception: API调用失败
        """
        if not self.llm_client:
            raise ValueError("LLM客户端未初始化，请检查LLM_API_KEY配置")
        
        try:
            response = self.llm_client.chat.completions.create(
                model=model or settings.LLM_MODEL_NAME,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"[AI Service] ❌ LLM调用失败: {str(e)}")
            raise
    
    def get_next_video_api_key(self) -> str:
        """
        获取下一个视频生成API Key（轮询）
        
        Returns:
            API Key
        """
        return self.video_api_pool.get_next_key()
    
    def get_current_video_api_key(self) -> str:
        """
        获取当前视频生成API Key（不轮询）
        
        Returns:
            API Key
        """
        return self.video_api_pool.get_current_key()


# 创建全局AI服务实例
ai_service = AIService()
