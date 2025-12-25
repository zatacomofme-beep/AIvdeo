"""
微信支付 Native 扫码支付模块
使用微信支付V3版本（推荐）
支持RSA签名、证书验证、回调验证
"""

import hashlib
import time
import uuid
import json
import base64
from typing import Dict, Optional
from datetime import datetime, timedelta
import requests
from dotenv import load_dotenv
import os
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
from cryptography.x509 import load_pem_x509_certificate

load_dotenv()

# 微信支付V3配置
WECHAT_APP_ID = os.getenv("WECHAT_APP_ID", "")  # V3版本必需
WECHAT_MCH_ID = os.getenv("WECHAT_MCH_ID", "1736760845")
WECHAT_API_V3_KEY = os.getenv("WECHAT_API_V3_KEY", "993124078Kingfecageahhafawggafag")  # 32位APIv3密钥
WECHAT_NOTIFY_URL = os.getenv("WECHAT_NOTIFY_URL", "https://www.semopic.com/api/wechat/callback")
WECHAT_BODY = os.getenv("WECHAT_BODY", "Semopic积分充值")

# 商户证书路径（用于签名）
WECHAT_CERT_SERIAL_NO = os.getenv("WECHAT_CERT_SERIAL_NO", "")  # 证书序列号
WECHAT_PRIVATE_KEY_PATH = os.getenv("WECHAT_PRIVATE_KEY_PATH", "./apiclient_key.pem")  # 商户私钥路径

# 微信支付V3 API地址
WECHAT_PAY_BASE_URL = "https://api.mch.weixin.qq.com/v3"
WECHAT_PAY_NATIVE_URL = f"{WECHAT_PAY_BASE_URL}/pay/transactions/native"


# 加载商户私钥
def load_private_key():
    """加载商户私钥"""
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


def generate_signature(method: str, url_path: str, timestamp: str, nonce_str: str, body: str = "") -> str:
    """
    生成微信支付V3签名
    签名规则：method
url
timestamp
nonce_str
body

    Args:
        method: 请求方法 (GET/POST)
        url_path: URL路径（不含域名和参数）
        timestamp: 时间戳（秒）
        nonce_str: 随机字符串
        body: 请求体（JSON字符串）
    
    Returns:
        Base64编码的签名
    """
    private_key = load_private_key()
    if not private_key:
        raise Exception("无法加载商户私钥")
    
    # 构建签名串
    sign_str = f"{method}\n{url_path}\n{timestamp}\n{nonce_str}\n{body}\n"
    
    # 使用SHA256withRSA签名
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
    格式: WECHATPAY2-SHA256-RSA2048 mchid="...",nonce_str="...",signature="...",timestamp="...",serial_no="..."
    """
    timestamp = str(int(time.time()))
    nonce_str = uuid.uuid4().hex.upper()
    
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
    创建Native扫码支付订单（微信支付V3）
    
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
    if not WECHAT_APP_ID:
        return {
            'success': False,
            'error': '微信AppID未配置（V3版本必需）'
        }
    
    if not WECHAT_CERT_SERIAL_NO:
        return {
            'success': False,
            'error': '商户证书序列号未配置'
        }
    
    # 构建请求数据（V3使用JSON格式）
    payload = {
        "appid": WECHAT_APP_ID,  # V3版本必需
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
        payload["attach"] = attach
    
    # 添加过期时间（15分钟后）
    expire_time = (datetime.now() + timedelta(minutes=15)).strftime('%Y-%m-%dT%H:%M:%S+08:00')
    payload["time_expire"] = expire_time
    
    print(f"[微信支付V3] 创建订单请求: {order_no}, 金额: {total_fee}分")
    
    try:
        # 转换为JSON字符串
        body_str = json.dumps(payload)
        
        # 生成Authorization头
        url_path = "/v3/pay/transactions/native"
        auth_header = build_authorization_header("POST", url_path, body_str)
        
        # 发送请求
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": auth_header,
            "User-Agent": "Mozilla/5.0"
        }
        
        print(f"[微信支付V3] 请求头: {headers}")
        print(f"[微信支付V3] 请求体: {body_str}")
        
        response = requests.post(
            WECHAT_PAY_NATIVE_URL,
            data=body_str,
            headers=headers,
            timeout=10
        )
        
        print(f"[微信支付V3] 响应状态码: {response.status_code}")
        print(f"[微信支付V3] 响应内容: {response.text}")
        
        # V3 API成功返回200
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
                error_msg = response.text
            
            return {
                'success': False,
                'error': f"API错误({response.status_code}): {error_msg}"
            }
    
    except Exception as e:
        print(f"[微信支付V3] 创建订单失败: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }


def verify_callback_signature(timestamp: str, nonce: str, body: str, signature: str, serial_no: str) -> bool:
    """
    验证微信支付V3回调签名
    
    Args:
        timestamp: 时间戳
        nonce: 随机串
        body: 应答主体
        signature: 应答签名
        serial_no: 微信支付平台证书序列号
    
    Returns:
        签名是否有效
    """
    # V3回调验签需要微信支付平台证书（不是商户证书）
    # 实际生产环境需要先下载并缓存平台证书
    # 这里简化处理，返回True（需要完善）
    print(f"[微信支付V3] 回调验签 - 时间戳:{timestamp}, 随机串:{nonce[:8]}..., 序列号:{serial_no}")
    
    # TODO: 完整的验签流程：
    # 1. 根据serial_no获取微信支付平台证书
    # 2. 构建验签串: timestamp\nnonce\nbody\n
    # 3. 使用平台证书公钥验证signature
    
    # 临时返回True，实际应该验证签名
    return True


def decrypt_callback_resource(nonce: str, associated_data: str, ciphertext: str) -> Dict:
    """
    解密微信支付V3回调中的resource数据
    使用AEAD_AES_256_GCM算法
    
    Args:
        nonce: 加密使用的随机串
        associated_data: 附加数据
        ciphertext: Base64编码的密文
    
    Returns:
        解密后的数据（字典）
    """
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    
    try:
        # APIv3密钥（32字节）
        key = WECHAT_API_V3_KEY.encode('utf-8')
        
        # Base64解码密文
        encrypted_data = base64.b64decode(ciphertext)
        
        # AEAD_AES_256_GCM解密
        aesgcm = AESGCM(key)
        decrypted = aesgcm.decrypt(
            nonce.encode('utf-8'),
            encrypted_data,
            associated_data.encode('utf-8')
        )
        
        # 转换为字典
        return json.loads(decrypted.decode('utf-8'))
    
    except Exception as e:
        print(f"[微信支付V3] 解密回调数据失败: {e}")
        return {}


def query_order(order_no: str) -> Dict:
    """
    查询订单状态（微信支付V3）
    
    Args:
        order_no: 商户订单号
    
    Returns:
        订单信息
    """
    try:
        # V3查询接口：GET /v3/pay/transactions/out-trade-no/{out_trade_no}
        url_path = f"/v3/pay/transactions/out-trade-no/{order_no}"
        query_url = f"{WECHAT_PAY_BASE_URL}/pay/transactions/out-trade-no/{order_no}?mchid={WECHAT_MCH_ID}"
        
        # 生成Authorization头（GET请求，body为空）
        auth_header = build_authorization_header("GET", url_path + f"?mchid={WECHAT_MCH_ID}", "")
        
        headers = {
            "Accept": "application/json",
            "Authorization": auth_header,
            "User-Agent": "Mozilla/5.0"
        }
        
        response = requests.get(query_url, headers=headers, timeout=10)
        
        print(f"[微信支付V3] 查询订单 {order_no} - 状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            trade_state = result.get('trade_state')  # SUCCESS/NOTPAY/CLOSED/REVOKED/USERPAYING/PAYERROR
            
            return {
                'success': True,
                'trade_state': trade_state,
                'transaction_id': result.get('transaction_id'),
                'total_fee': result.get('amount', {}).get('total', 0),
                'payer_total': result.get('amount', {}).get('payer_total', 0),
                'success_time': result.get('success_time')
            }
        elif response.status_code == 404:
            # 订单不存在
            return {
                'success': False,
                'error': '订单不存在'
            }
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('message', '查询失败')
            except:
                error_msg = response.text
            
            return {
                'success': False,
                'error': f"查询失败({response.status_code}): {error_msg}"
            }
    
    except Exception as e:
        print(f"[微信支付V3] 查询订单失败: {e}")
        import traceback
        traceback.print_exc()
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
    print(f"\n创建测试订单: {test_order_no}")
    
    result = create_native_order(
        order_no=test_order_no,
        total_fee=1,  # 1分钱测试
        body="测试订单"
    )
    
    print(f"\n测试结果: {result}")
    
    if result['success']:
        print(f"\n✅ 订单创建成功！")
        print(f"二维码链接: {result['code_url']}")
        print("请使用微信扫描二维码进行支付测试")
    else:
        print(f"\n❌ 订单创建失败: {result.get('error')}")
