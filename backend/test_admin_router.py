"""
测试管理员路由是否成功注册
"""
import sys
sys.path.insert(0, 'c:/Users/Administrator/Desktop/AIvdeo/backend')

from fastapi import FastAPI
from routers.admin import router as admin_router

# 创建测试应用
app = FastAPI()
app.include_router(admin_router)

# 打印所有路由
print("=" * 80)
print("管理员路由测试")
print("=" * 80)
print("\n已注册的路由:")
for route in app.routes:
    if hasattr(route, 'methods') and hasattr(route, 'path'):
        methods = list(route.methods)
        print(f"  {methods[0]:6} {route.path}")

print("\n✅ 管理员路由模块加载成功！")
print("=" * 80)
