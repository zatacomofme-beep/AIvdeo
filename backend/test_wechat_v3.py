#!/usr/bin/env python3
"""
微信支付V3配置测试脚本
用于验证配置是否正确
"""

import os
import sys
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def print_section(title):
    """打印分隔线"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def check_env_vars():
    """检查环境变量配置"""
    print_section("检查环境变量配置")
    
    required_vars = {
        'WECHAT_APP_ID': '微信AppID',
        'WECHAT_MCH_ID': '商户号',
        'WECHAT_API_V3_KEY': 'APIv3密钥',
        'WECHAT_CERT_SERIAL_NO': '证书序列号',
        'WECHAT_PRIVATE_KEY_PATH': '私钥路径',
        'WECHAT_NOTIFY_URL': '回调地址',
    }
    
    all_ok = True
    for var, desc in required_vars.items():
        value = os.getenv(var)
        if not value:
            print(f"❌ {desc} ({var}): 未配置")
            all_ok = False
        else:
            # 隐藏敏感信息
            if var in ['WECHAT_API_V3_KEY', 'WECHAT_CERT_SERIAL_NO']:
                display_value = value[:8] + '...' + value[-8:] if len(value) > 16 else value
            else:
                display_value = value
            print(f"✅ {desc} ({var}): {display_value}")
    
    return all_ok

def check_private_key():
    """检查私钥文件"""
    print_section("检查商户私钥文件")
    
    key_path = os.getenv('WECHAT_PRIVATE_KEY_PATH', './apiclient_key.pem')
    
    if not os.path.exists(key_path):
        print(f"❌ 私钥文件不存在: {key_path}")
        print("\n请下载商户证书并将 apiclient_key.pem 放到指定位置")
        print("下载地址: https://pay.weixin.qq.com/ > 账户中心 > API安全 > 申请API证书")
        return False
    
    print(f"✅ 私钥文件存在: {key_path}")
    
    # 检查文件内容
    try:
        with open(key_path, 'r') as f:
            content = f.read()
            if '-----BEGIN PRIVATE KEY-----' in content:
                print("✅ 私钥格式正确（PEM格式）")
                return True
            else:
                print("❌ 私钥格式错误，应该是PEM格式")
                return False
    except Exception as e:
        print(f"❌ 读取私钥失败: {e}")
        return False

def check_cryptography():
    """检查cryptography库"""
    print_section("检查cryptography依赖")
    
    try:
        import cryptography
        print(f"✅ cryptography已安装，版本: {cryptography.__version__}")
        return True
    except ImportError:
        print("❌ cryptography未安装")
        print("\n请运行以下命令安装:")
        print("    pip install cryptography==42.0.0")
        return False

def test_signature():
    """测试签名生成"""
    print_section("测试签名生成")
    
    try:
        from wechat_pay import load_private_key, generate_signature
        
        # 尝试加载私钥
        private_key = load_private_key()
        if not private_key:
            print("❌ 无法加载私钥")
            return False
        
        print("✅ 私钥加载成功")
        
        # 尝试生成签名
        try:
            signature = generate_signature(
                method="GET",
                url_path="/v3/pay/transactions/id/test",
                timestamp="1234567890",
                nonce_str="test_nonce",
                body=""
            )
            print("✅ 签名生成成功")
            print(f"   签名示例: {signature[:50]}...")
            return True
        except Exception as e:
            print(f"❌ 签名生成失败: {e}")
            return False
            
    except ImportError as e:
        print(f"❌ 导入wechat_pay模块失败: {e}")
        return False

def test_create_order():
    """测试创建订单"""
    print_section("测试创建订单（1分钱）")
    
    try:
        from wechat_pay import create_native_order
        import time
        
        order_no = f"TEST{int(time.time())}"
        print(f"订单号: {order_no}")
        
        result = create_native_order(
            order_no=order_no,
            total_fee=1,  # 1分钱
            body="测试订单"
        )
        
        if result['success']:
            print("✅ 订单创建成功！")
            print(f"   二维码链接: {result['code_url']}")
            print("\n你可以使用微信扫描以下链接生成的二维码进行支付测试：")
            print(f"   https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={result['code_url']}")
            return True
        else:
            print(f"❌ 订单创建失败: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主函数"""
    print("\n" + "🔧 微信支付V3配置测试工具".center(80))
    
    # 1. 检查环境变量
    if not check_env_vars():
        print("\n⚠️ 请先配置 .env 文件中的必需参数")
        print("参考: 微信支付V3配置指南.md")
        sys.exit(1)
    
    # 2. 检查cryptography库
    if not check_cryptography():
        print("\n⚠️ 请先安装cryptography库")
        sys.exit(1)
    
    # 3. 检查私钥文件
    if not check_private_key():
        print("\n⚠️ 请先下载并配置商户私钥文件")
        sys.exit(1)
    
    # 4. 测试签名生成
    if not test_signature():
        print("\n⚠️ 签名生成失败，请检查配置")
        sys.exit(1)
    
    # 5. 测试创建订单
    print("\n" + "="*80)
    choice = input("是否测试创建真实订单（1分钱）？[y/N]: ")
    if choice.lower() == 'y':
        if test_create_order():
            print_section("测试完成")
            print("✅ 所有配置正确，可以正常使用微信支付V3！")
        else:
            print_section("测试失败")
            print("❌ 订单创建失败，请检查配置或查看错误日志")
            sys.exit(1)
    else:
        print("\n⏭️ 跳过订单创建测试")
        print_section("基础配置检查完成")
        print("✅ 基础配置正确，但未测试真实订单创建")
        print("   建议运行完整测试以确保可以正常使用")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试已取消")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ 测试过程出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
