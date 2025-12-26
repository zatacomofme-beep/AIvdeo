"""
测试阶段5路由模块注册情况

验证以下路由模块:
- routers/product.py - 商品管理 (5个接口)
- routers/prompt.py - 提示词管理 (3个接口)
- routers/character.py - 角色管理 (1个接口)
- routers/project.py - 项目管理 (2个接口)

创建时间: 2025-12-27
重构阶段: 阶段5
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_openapi():
    """测试OpenAPI文档中是否包含阶段5的所有路由"""
    print("="*80)
    print("[测试] 验证阶段5路由注册情况")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/openapi.json")
        if response.status_code != 200:
            print(f"❌ OpenAPI文档获取失败: {response.status_code}")
            return False
        
        spec = response.json()
        paths = spec.get('paths', {})
        
        # 阶段5应该包含的接口
        stage5_routes = {
            # 商品管理 (5个接口)
            "POST /api/products": "创建商品",
            "GET /api/products/{user_id}": "获取用户商品列表",
            "GET /api/product/{product_id}": "获取商品详情",
            "PUT /api/product/{product_id}": "更新商品",
            "DELETE /api/product/{product_id}": "删除商品",
            
            # 提示词管理 (3个接口)
            "POST /api/prompts": "保存提示词",
            "GET /api/prompts/{user_id}": "获取用户提示词列表",
            "DELETE /api/prompts/{prompt_id}": "删除提示词",
            
            # 角色管理 (1个接口)
            "GET /api/characters/{user_id}": "获取用户角色列表",
            
            # 项目管理 (2个接口)
            "POST /api/projects": "创建项目",
            "GET /api/projects/{user_id}": "获取用户项目列表",
        }
        
        print(f"\n📊 OpenAPI文档中共有 {len(paths)} 个接口")
        print(f"📊 阶段5应包含 {len(stage5_routes)} 个接口\n")
        
        # 检查每个接口
        found_count = 0
        missing_routes = []
        
        for route_key, description in stage5_routes.items():
            method, path = route_key.split(' ', 1)
            method = method.lower()
            
            if path in paths and method in paths[path]:
                found_count += 1
                print(f"✅ {route_key} - {description}")
            else:
                missing_routes.append(route_key)
                print(f"❌ {route_key} - {description} (未找到)")
        
        print("\n" + "="*80)
        print(f"📊 注册统计: {found_count}/{len(stage5_routes)} 个接口已注册")
        print("="*80)
        
        if missing_routes:
            print("\n❌ 缺失的接口:")
            for route in missing_routes:
                print(f"  - {route}")
            return False
        else:
            print("\n✅ 所有阶段5路由已成功注册!")
            return True
            
    except requests.RequestException as e:
        print(f"❌ 请求失败: {e}")
        print("⚠️  请确保服务器正在运行 (python main.py)")
        return False
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        return False


def test_route_grouping():
    """测试路由是否正确分组到标签中"""
    print("\n" + "="*80)
    print("[测试] 验证路由标签分组")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/openapi.json")
        spec = response.json()
        paths = spec.get('paths', {})
        
        # 统计每个标签下的路由数量
        tag_counts = {
            "Product Management": 0,
            "Prompt Management": 0,
            "Character Management": 0,
            "Project Management": 0,
        }
        
        for path, methods in paths.items():
            for method, details in methods.items():
                tags = details.get('tags', [])
                for tag in tags:
                    if tag in tag_counts:
                        tag_counts[tag] += 1
        
        print()
        for tag, count in tag_counts.items():
            if count > 0:
                print(f"✅ {tag}: {count} 个接口")
            else:
                print(f"❌ {tag}: 0 个接口 (可能未注册)")
        
        total = sum(tag_counts.values())
        print(f"\n📊 阶段5路由总计: {total} 个接口")
        
        return total == 11  # 阶段5应该有11个接口
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False


if __name__ == "__main__":
    print("\n🚀 开始测试阶段5路由模块...\n")
    
    # 测试1: 验证所有路由是否注册
    test1_passed = test_openapi()
    
    # 测试2: 验证路由分组
    test2_passed = test_route_grouping()
    
    # 总结
    print("\n" + "="*80)
    print("📊 测试总结")
    print("="*80)
    print(f"测试1 - 路由注册: {'✅ 通过' if test1_passed else '❌ 失败'}")
    print(f"测试2 - 路由分组: {'✅ 通过' if test2_passed else '❌ 失败'}")
    
    if test1_passed and test2_passed:
        print("\n🎉 阶段5路由模块测试全部通过!")
        print("\n📝 已注册的路由模块:")
        print("  1. 商品管理路由 (routers/product.py) - 5个接口")
        print("  2. 提示词管理路由 (routers/prompt.py) - 3个接口")
        print("  3. 角色管理路由 (routers/character.py) - 1个接口")
        print("  4. 项目管理路由 (routers/project.py) - 2个接口")
        print("\n✅ 总计: 11个接口已成功迁移到独立路由模块")
    else:
        print("\n❌ 部分测试失败，请检查路由注册情况")
    
    print("="*80 + "\n")
