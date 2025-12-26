"""
微信支付V3 Native扫码支付模块
使用RSA-SHA256签名算法，JSON数据格式
"""

import os
import json
import time
import uuid
import base64
import hashlib
import requests
from datetime import datetime, timedelta
from typing import Dict, Optional
from dotenv import load_dotenv

# 导入加密库
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
from cryptography.x509 import load_pem_x509_certificate

load_dotenv()

# 微信支付V3配置
WECHAT_APP_ID = os.getenv("WECHAT_APP_ID")
WECHAT_MCH_ID = os.getenv("WECHAT_MCH_ID")
WECHAT_API_V3_KEY = os.getenv("WECHAT_API_V3_KEY")
WECHAT_CERT_SERIAL_NO = os.getenv("WECHAT_CERT_SERIAL_NO")
WECHAT_PRIVATE_KEY_PATH = os.getenv("WECHAT_PRIVATE_KEY_PATH", "./apiclient_key.pem")
WECHAT_NOTIFY_URL = os.getenv("WECHAT_NOTIFY_URL", "https://www.semopic.com/api/wechat/callback")
WECHAT_BODY = os.getenv("WECHAT_BODY", "Semopic积分充值")

# 微信支付V3 API地址
WECHAT_PAY_BASE_URL = "https://api.mch.weixin.qq.com"
WECHAT_PAY_NATIVE_URL = f"{WECHAT_PAY_BASE_URL}/v3/pay/transactions/native"


def load_private_key():
    """
    加载商户私钥
    """
    try:
        with open(WECHAT_PRIVATE_KEY_PATH, 'rb') as f:
            private_key = serialization.load_pem_private_key(
                f.read(),
                password=None,
                backend=default_backend()
            )
        return private_key
    except Exception as e:
        print(f"[微信支付V3] 加载私钥失败: {e}")
        return None


def generate_signature(method: str, url_path: str, timestamp: str, nonce_str: str, body: str) -> str:
    """
    生成V3签名
    
    签名算法：
    1. 构造签名串
    2. 使用商户私钥对签名串进行SHA256 with RSA签名
    3. 对签名结果进行Base64编码
    """
    private_key = load_private_key()
    if not private_key:
        raise Exception("无法加载商户私钥")
    
    # 构造签名串
    sign_str = f"{method}\n{url_path}\n{timestamp}\n{nonce_str}\n{body}\n"
    
    # 使用私钥签名
    signature = private_key.sign(
        sign_str.encode('utf-8'),
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    
    # Base64编码
    return base64.b64encode(signature).decode('utf-8')


def build_authorization_header(method: str, url_path: str, body: str = "") -> str:
    """
    构建Authorization请求头
    
    格式：WECHATPAY2-SHA256-RSA2048 mchid="",nonce_str="",signature="",timestamp="",serial_no=""
    """
    timestamp = str(int(time.time()))
    nonce_str = uuid.uuid4().hex
    
    signature = generate_signature(method, url_path, timestamp, nonce_str, body)
    
    auth_str = (
        f'WECHATPAY2-SHA256-RSA2048 '
        f'mchid="{WECHAT_MCH_ID}",'
        f'nonce_str="{nonce_str}",'
        f'signature="{signature}",'
        f'timestamp="{timestamp}",'
        f'serial_no="{WECHAT_CERT_SERIAL_NO}"'
    )
    
    return auth_str


def create_native_order(
    order_no: str,
    total_fee: int,  # 单位：分
    body: Optional[str] = None,
    attach: Optional[str] = None
) -> Dict:
    """
    创建Native扫码支付订单（V3版本）
    
    Args:
        order_no: 商户订单号（唯一）
        total_fee: 订单金额（单位：分，例如1元=100分）
        body: 商品描述
        attach: 附加数据（可选）
    
    Returns:
        {
            'success': True/False,
            'code_url': '二维码链接',
            'error': '错误信息'
        }
    """
    # 构建请求体
    request_body = {
        "appid": WECHAT_APP_ID,
        "mchid": WECHAT_MCH_ID,
        "description": body or WECHAT_BODY,
        "out_trade_no": order_no,
        "notify_url": WECHAT_NOTIFY_URL,
        "amount": {
            "total": total_fee,
            "currency": "CNY"
        }
    }
    
    # 添加附加数据
    if attach:
        request_body["attach"] = attach
    
    # 转换为JSON
    body_json = json.dumps(request_body)
    
    # 构建请求头
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": build_authorization_header("POST", "/v3/pay/transactions/native", body_json),
        "User-Agent": "Semopic/1.0"
    }
    
    print(f"[微信支付V3] 创建订单请求: {order_no}, 金额: {total_fee}分")
    
    try:
        # 发送请求
        response = requests.post(
            WECHAT_PAY_NATIVE_URL,
            data=body_json,
            headers=headers,
            timeout=10
        )
        
        print(f"[微信支付V3] 响应状态码: {response.status_code}")
        print(f"[微信支付V3] 响应内容: {response.text}")
        
        # 检查HTTP状态码
        if response.status_code == 200:
            result = response.json()
            return {
                'success': True,
                'code_url': result.get('code_url'),
                'order_no': order_no
            }
        else:
            # 解析错误信息
            try:
                error_data = response.json()
                error_msg = error_data.get('message', '未知错误')
            except:
                error_msg = response.text or f"HTTP {response.status_code}"
            
            return {
                'success': False,
                'error': error_msg
            }
    
    except Exception as e:
        print(f"[微信支付V3] 创建订单失败: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def verify_callback_signature(timestamp: str, nonce: str, body: str, signature: str, serial: str) -> bool:
    """
    验证微信支付回调签名（V3版本）
    
    Args:
        timestamp: 时间戳
        nonce: 随机串
        body: 请求体
        signature: 签名
        serial: 证书序列号
    
    Returns:
        签名是否有效
    """
    # TODO: 实现V3版本的回调签名验证
    # 需要从微信获取平台证书公钥
    # 这里暂时返回True，实际使用时需要完善
    return True


def decrypt_callback_resource(ciphertext: str, nonce: str, associated_data: str) -> Dict:
    """
    解密回调通知中的resource字段（V3版本使用AES-256-GCM加密）
    
    Args:
        ciphertext: 密文（Base64编码）
        nonce: 随机串
        associated_data: 附加数据
    
    Returns:
        解密后的数据
    """
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    
    # APIv3密钥
    key = WECHAT_API_V3_KEY.encode('utf-8')
    
    # 解码密文
    ciphertext_bytes = base64.b64decode(ciphertext)
    
    # AES-GCM解密
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(
        nonce.encode('utf-8'),
        ciphertext_bytes,
        associated_data.encode('utf-8')
    )
    
    return json.loads(plaintext.decode('utf-8'))


def query_order(order_no: str) -> Dict:
    """
    查询订单状态（V3版本）
    
    Args:
        order_no: 商户订单号
    
    Returns:
        订单信息
    """
    url_path = f"/v3/pay/transactions/out-trade-no/{order_no}"
    url = f"{WECHAT_PAY_BASE_URL}{url_path}?mchid={WECHAT_MCH_ID}"
    
    headers = {
        "Accept": "application/json",
        "Authorization": build_authorization_header("GET", f"{url_path}?mchid={WECHAT_MCH_ID}"),
        "User-Agent": "Semopic/1.0"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            trade_state = result.get('trade_state')  # SUCCESS/NOTPAY/CLOSED/REVOKED/USERPAYING/PAYERROR
            
            return {
                'success': True,
                'trade_state': trade_state,
                'transaction_id': result.get('transaction_id'),
                'total_fee': result.get('amount', {}).get('total', 0),
            }
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('message', '查询失败')
            except:
                error_msg = f"HTTP {response.status_code}"
            
            return {
                'success': False,
                'error': error_msg
            }
    
    except Exception as e:
        print(f"[微信支付V3] 查询订单失败: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# 测试代码
if __name__ == "__main__":
    print("="*80)
    print("微信支付V3测试")
    print("="*80)
    print(f"AppID: {WECHAT_APP_ID}")
    print(f"商户号: {WECHAT_MCH_ID}")
    print(f"证书序列号: {WECHAT_CERT_SERIAL_NO}")
    print(f"私钥路径: {WECHAT_PRIVATE_KEY_PATH}")
    print("="*80)
    
    # 测试创建订单
    test_order_no = f"TEST{int(time.time())}"
    print(f"\n创建测试订单: {test_order_no}\n")
    
    result = create_native_order(
        order_no=test_order_no,
        total_fee=1,  # 1分钱测试
        body="测试订单"
    )
    
    print(f"\n测试结果: {result}\n")
    
    if result['success']:
        print("✅ 订单创建成功！")
        print(f"二维码链接: {result['code_url']}")
        print("请使用微信扫描二维码进行支付测试")
    else:
        print("❌ 订单创建失败!")
        print(f"错误: {result.get('error')}")
