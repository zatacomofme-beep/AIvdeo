"""
配置管理模块
从环境变量读取所有配置项，统一管理
"""

import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class Settings:
    """应用配置类"""
    
    # ======================
    # 火山云 TOS 存储配置
    # ======================
    TOS_ENDPOINT: str = os.getenv("TOS_ENDPOINT", "https://tos-cn-beijing.volces.com")
    TOS_REGION: str = os.getenv("TOS_REGION", "cn-beijing")
    TOS_BUCKET: str = os.getenv("TOS_BUCKET", "sora-2")
    TOS_ACCESS_KEY: str = os.getenv("TOS_ACCESS_KEY", "")
    TOS_SECRET_KEY: str = os.getenv("TOS_SECRET_KEY", "")
    
    # ======================
    # AI 模型配置
    # ======================
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash-exp")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://yunwu.ai")
    
    VIDEO_MODEL_NAME: str = os.getenv("VIDEO_MODEL_NAME", "sora-2")
    VIDEO_API_KEY: str = os.getenv("VIDEO_GENERATION_API_KEY", "")
    VIDEO_BASE_URL: str = os.getenv("VIDEO_GENERATION_ENDPOINT", "https://yunwu.ai")
    
    # API令牌池配置
    API_KEY_POOL_STR: str = os.getenv("API_KEY_POOL", "")
    
    # Sora角色视频生成配置
    CHARACTER_VIDEO_MODEL_NAME: str = os.getenv("CHARACTER_VIDEO_MODEL_NAME", "sora-2")
    CHARACTER_VIDEO_API_KEY: str = os.getenv("CHARACTER_VIDEO_API_KEY", "")
    CHARACTER_VIDEO_BASE_URL: str = os.getenv("CHARACTER_VIDEO_ENDPOINT", "https://yunwu.ai")
    
    # 生图模型配置
    IMAGE_GEN_MODEL_NAME: str = os.getenv("IMAGE_GEN_MODEL_NAME", "gemini-3-pro-image-preview")
    IMAGE_GEN_API_KEY: str = os.getenv("IMAGE_GEN_API_KEY", "")
    IMAGE_GEN_BASE_URL: str = os.getenv("IMAGE_GEN_BASE_URL", "https://yunwu.ai")
    
    # ======================
    # 业务配置
    # ======================
    CREDITS_PER_VIDEO: int = int(os.getenv("CREDITS_PER_VIDEO", "70"))
    INITIAL_CREDITS: int = int(os.getenv("INITIAL_CREDITS", "100"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
    
    # ======================
    # 微信支付配置
    # ======================
    WECHAT_MCH_ID: str = os.getenv("WECHAT_MCH_ID", "")
    WECHAT_API_KEY: str = os.getenv("WECHAT_API_KEY", "")
    WECHAT_NOTIFY_URL: str = os.getenv("WECHAT_NOTIFY_URL", "")
    WECHAT_BODY: str = os.getenv("WECHAT_BODY", "Semopic积分充值")
    
    # ======================
    # 服务器配置
    # ======================
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    APP_DEBUG: bool = os.getenv("APP_DEBUG", "false").lower() == "true"
    
    # JWT配置
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-this-in-production")
    
    # CORS配置
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
    
    # 日志级别
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    @classmethod
    def get_api_key_pool(cls) -> list[str]:
        """获取API密钥池"""
        if not cls.API_KEY_POOL_STR:
            return []
        return [key.strip() for key in cls.API_KEY_POOL_STR.split(",") if key.strip()]
    
    @classmethod
    def get_cors_origins(cls) -> list[str]:
        """获取CORS允许的源列表"""
        return [origin.strip() for origin in cls.CORS_ORIGINS.split(",") if origin.strip()]
    
    @classmethod
    def validate(cls) -> None:
        """验证必需的配置项"""
        errors = []
        
        if not cls.TOS_ACCESS_KEY:
            errors.append("TOS_ACCESS_KEY 未配置")
        if not cls.TOS_SECRET_KEY:
            errors.append("TOS_SECRET_KEY 未配置")
        if not cls.LLM_API_KEY:
            errors.append("LLM_API_KEY 未配置")
        if not cls.VIDEO_API_KEY and not cls.API_KEY_POOL_STR:
            errors.append("VIDEO_GENERATION_API_KEY 或 API_KEY_POOL 未配置")
        
        if errors:
            print("⚠️  配置警告:")
            for error in errors:
                print(f"   - {error}")
        else:
            print("✅ 配置验证通过")


# 创建全局配置实例
settings = Settings()

# 打印配置信息（调试用）
if __name__ == "__main__":
    print("=" * 80)
    print("配置信息:")
    print(f"TOS Bucket: {settings.TOS_BUCKET}")
    print(f"TOS Region: {settings.TOS_REGION}")
    print(f"LLM Model: {settings.LLM_MODEL_NAME}")
    print(f"Video Model: {settings.VIDEO_MODEL_NAME}")
    print(f"API Key Pool: {len(settings.get_api_key_pool())} keys")
    print(f"Credits per video: {settings.CREDITS_PER_VIDEO}")
    print(f"Initial credits: {settings.INITIAL_CREDITS}")
    print("=" * 80)
    settings.validate()
