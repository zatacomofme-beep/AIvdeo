"""
微信支付测试脚本
测试创建订单和生成二维码功能
"""

import sys
sys.path.append('.')

from wechat_pay import create_native_order
import time

# 测试创建订单
print("="*60)
print("微信支付Native扫码支付测试")
print("="*60)

# 生成测试订单号
test_order_no = f"TEST{int(time.time())}"

print(f"\n1. 创建测试订单...")
print(f"   订单号: {test_order_no}")
print(f"   金额: 0.01元 (1分)")

result = create_native_order(
    order_no=test_order_no,
    total_fee=1,  # 1分钱测试
    body="【测试订单】Semopic积分充值",
    attach="test_user_123"
)

print(f"\n2. 创建结果:")
if result['success']:
    print(f"   ✅ 成功!")
    print(f"   二维码链接: {result['code_url']}")
    print(f"\n3. 测试步骤:")
    print(f"   - 复制上面的二维码链接")
    print(f"   - 在浏览器打开: https://tool.lu/qrcode/")
    print(f"   - 粘贴链接生成二维码")
    print(f"   - 使用微信扫描二维码进行支付测试")
    print(f"\n注意: 这是真实支付环境，支付的金额会真的扣费!")
else:
    print(f"   ❌ 失败!")
    print(f"   错误: {result.get('error', '未知错误')}")

print("\n" + "="*60)
