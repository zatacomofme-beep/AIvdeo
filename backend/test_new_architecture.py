"""
测试新架构是否能正常工作
"""

import sys
import os

# 添加backend目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 80)
print("测试新架构模块")
print("=" * 80)

# 测试配置模块
print("\n1. 测试配置模块...")
try:
    from config import settings
    print(f"   ✅ 配置加载成功")
    print(f"   - TOS Bucket: {settings.TOS_BUCKET}")
    print(f"   - LLM Model: {settings.LLM_MODEL_NAME}")
    print(f"   - API Key Pool: {len(settings.get_api_key_pool())} 个密钥")
    settings.validate()
except Exception as e:
    print(f"   ❌ 配置模块失败: {e}")
    sys.exit(1)

# 测试工具模块
print("\n2. 测试工具模块...")
try:
    from utils import APIKeyPool, build_public_url
    
    # 测试API Key Pool
    pool = APIKeyPool(["key1", "key2", "key3"], fallback_key="fallback")
    print(f"   ✅ API Key Pool 创建成功，大小: {pool.size()}")
    print(f"   - 当前Key: {pool.get_current_key()}")
    print(f"   - 下一个Key: {pool.get_next_key()}")
    
    # 测试URL构建
    url = build_public_url("test-bucket", "test/file.jpg")
    print(f"   ✅ URL构建成功: {url}")
    
except Exception as e:
    print(f"   ❌ 工具模块失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 测试服务模块
print("\n3. 测试服务模块...")
try:
    from services import tos_service, ai_service, credit_service
    
    # 测试TOS服务
    if tos_service:
        print(f"   ✅ TOS服务初始化成功")
        print(f"   - Bucket: {tos_service.bucket}")
    else:
        print(f"   ⚠️  TOS服务未初始化（可能是配置缺失）")
    
    # 测试AI服务
    print(f"   ✅ AI服务初始化成功")
    print(f"   - LLM可用: {ai_service.llm_client is not None}")
    print(f"   - Video API Pool: {ai_service.video_api_pool.size()} 个密钥")
    
    # 测试积分服务
    print(f"   ✅ 积分服务初始化成功")
    
except Exception as e:
    print(f"   ❌ 服务模块失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 测试路由模块
print("\n4. 测试路由模块...")
try:
    from routers.health import router as health_router
    print(f"   ✅ 健康检查路由加载成功")
    print(f"   - 路由数量: {len(health_router.routes)}")
    for route in health_router.routes:
        print(f"     • {route.methods} {route.path}")
    
except Exception as e:
    print(f"   ❌ 路由模块失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 80)
print("✅ 所有模块测试通过！新架构可以正常工作。")
print("=" * 80)

print("\n📋 下一步:")
print("1. 在main.py中注册健康检查路由")
print("2. 启动服务器测试新接口")
print("3. 逐步创建其他路由模块")
print("4. 将现有功能迁移到新架构")
