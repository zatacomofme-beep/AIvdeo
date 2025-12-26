"""
微信支付 Native 扫码支付模块
使用微信支付V2版本（简单稳定）
"""

import hashlib
import time
import uuid
import xml.etree.ElementTree as ET
from typing import Dict, Optional
import requests
from dotenv import load_dotenv
import os

load_dotenv()

# 微信支付配置
WECHAT_MCH_ID = os.getenv("WECHAT_MCH_ID", "1736760845")
WECHAT_API_KEY = os.getenv("WECHAT_API_KEY", "993124078Kingfecageahhafawggafag")
WECHAT_NOTIFY_URL = os.getenv("WECHAT_NOTIFY_URL", "https://www.semopic.com/api/wechat/callback")
WECHAT_BODY = os.getenv("WECHAT_BODY", "Semopic积分充值")

# 微信支付API地址
WECHAT_PAY_URL = "https://api.mch.weixin.qq.com/pay/unifiedorder"


def generate_sign(params: Dict[str, str], api_key: str) -> str:
    """
    生成微信支付签名
    """
    # 1. 参数按key排序
    sorted_params = sorted(params.items(), key=lambda x: x[0])
    
    # 2. 拼接成字符串 key1=value1&key2=value2...
    string_a = "&".join([f"{k}={v}" for k, v in sorted_params if v])
    
    # 3. 拼接API密钥
    string_sign_temp = f"{string_a}&key={api_key}"
    
    # 4. MD5加密并转大写
    sign = hashlib.md5(string_sign_temp.encode('utf-8')).hexdigest().upper()
    
    return sign


def dict_to_xml(data: Dict) -> str:
    """
    字典转XML
    """
    xml = ["<xml>"]
    for k, v in data.items():
        xml.append(f"<{k}><![CDATA[{v}]]></{k}>")
    xml.append("</xml>")
    return "".join(xml)


def xml_to_dict(xml_str: str) -> Dict:
    """
    XML转字典
    """
    root = ET.fromstring(xml_str)
    return {child.tag: child.text for child in root}


def create_native_order(
    order_no: str,
    total_fee: int,  # 单位：分
    body: Optional[str] = None,
    attach: Optional[str] = None
) -> Dict:
    """
    创建Native扫码支付订单
    
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
    # 生成随机字符串
    nonce_str = uuid.uuid4().hex
    
    # 构建请求参数
    params = {
        'appid': '',  # Native支付不需要appid，留空
        'mch_id': WECHAT_MCH_ID,
        'nonce_str': nonce_str,
        'body': body or WECHAT_BODY,
        'out_trade_no': order_no,
        'total_fee': str(total_fee),
        'spbill_create_ip': '127.0.0.1',  # 终端IP
        'notify_url': WECHAT_NOTIFY_URL,
        'trade_type': 'NATIVE',
    }
    
    # 添加附加数据
    if attach:
        params['attach'] = attach
    
    # 生成签名
    params['sign'] = generate_sign(params, WECHAT_API_KEY)
    
    # 转换为XML
    xml_data = dict_to_xml(params)
    
    print(f"[微信支付] 创建订单请求: {order_no}, 金额: {total_fee}分")
    
    try:
        # 发送请求
        response = requests.post(
            WECHAT_PAY_URL,
            data=xml_data.encode('utf-8'),
            headers={'Content-Type': 'application/xml'},
            timeout=10
        )
        
        # 解析响应
        result = xml_to_dict(response.text)
        
        print(f"[微信支付] 响应: {result}")
        
        # 检查返回状态
        if result.get('return_code') == 'SUCCESS' and result.get('result_code') == 'SUCCESS':
            return {
                'success': True,
                'code_url': result.get('code_url'),
                'prepay_id': result.get('prepay_id')
            }
        else:
            return {
                'success': False,
                'error': result.get('return_msg') or result.get('err_code_des', '未知错误')
            }
    
    except Exception as e:
        print(f"[微信支付] 创建订单失败: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def verify_callback(data: Dict) -> bool:
    """
    验证微信支付回调签名
    
    Args:
        data: 微信回调数据（字典格式）
    
    Returns:
        签名是否有效
    """
    # 提取签名
    sign = data.pop('sign', None)
    if not sign:
        return False
    
    # 重新计算签名
    calculated_sign = generate_sign(data, WECHAT_API_KEY)
    
    return sign == calculated_sign


def query_order(order_no: str) -> Dict:
    """
    查询订单状态
    
    Args:
        order_no: 商户订单号
    
    Returns:
        订单信息
    """
    nonce_str = uuid.uuid4().hex
    
    params = {
        'appid': '',
        'mch_id': WECHAT_MCH_ID,
        'out_trade_no': order_no,
        'nonce_str': nonce_str,
    }
    
    params['sign'] = generate_sign(params, WECHAT_API_KEY)
    
    xml_data = dict_to_xml(params)
    
    try:
        response = requests.post(
            'https://api.mch.weixin.qq.com/pay/orderquery',
            data=xml_data.encode('utf-8'),
            headers={'Content-Type': 'application/xml'},
            timeout=10
        )
        
        result = xml_to_dict(response.text)
        
        if result.get('return_code') == 'SUCCESS' and result.get('result_code') == 'SUCCESS':
            return {
                'success': True,
                'trade_state': result.get('trade_state'),  # SUCCESS/NOTPAY/CLOSED/REVOKED/USERPAYING/PAYERROR
                'transaction_id': result.get('transaction_id'),
                'total_fee': int(result.get('total_fee', 0)),
            }
        else:
            return {
                'success': False,
                'error': result.get('return_msg') or result.get('err_code_des', '查询失败')
            }
    
    except Exception as e:
        print(f"[微信支付] 查询订单失败: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# 测试代码
if __name__ == "__main__":
    # 测试创建订单
    test_order_no = f"TEST{int(time.time())}"
    result = create_native_order(
        order_no=test_order_no,
        total_fee=1,  # 1分钱测试
        body="测试订单"
    )
    
    print(f"\n测试结果: {result}")
    
    if result['success']:
        print(f"\n二维码链接: {result['code_url']}")
        print("请使用微信扫描二维码进行支付测试")
