#!/usr/bin/env python3
"""
TOS上传诊断脚本 - 直接测试上传功能
"""
import os
import io
from dotenv import load_dotenv
import boto3
from botocore.config import Config

load_dotenv()

AK = os.getenv("TOS_ACCESS_KEY")
SK = os.getenv("TOS_SECRET_KEY")
ENDPOINT = os.getenv("TOS_ENDPOINT", "https://tos-cn-beijing.volces.com")
REGION = os.getenv("TOS_REGION", "cn-beijing")
BUCKET = os.getenv("TOS_BUCKET", "sora-2")

print("=" * 60)
print("TOS 上传诊断")
print("=" * 60)
print(f"AK: {AK[:15]}..." if AK else "AK: 未配置")
print(f"SK: {SK[:15]}..." if SK else "SK: 未配置")
print(f"Endpoint: {ENDPOINT}")
print(f"Region: {REGION}")
print(f"Bucket: {BUCKET}")
print("=" * 60)

# 测试1: 默认配置
print("\n[测试1] 默认boto3配置...")
try:
    client1 = boto3.client(
        "s3",
        endpoint_url=ENDPOINT,
        aws_access_key_id=AK,
        aws_secret_access_key=SK,
        region_name=REGION
    )
    
    test_key = "test/diagnostic_default.txt"
    test_content = b"Test upload with default config"
    
    client1.put_object(
        Bucket=BUCKET,
        Key=test_key,
        Body=io.BytesIO(test_content)
    )
    print(f"✅ 上传成功: {test_key}")
except Exception as e:
    print(f"❌ 失败: {e}")

# 测试2: s3v4签名
print("\n[测试2] 使用s3v4签名...")
try:
    client2 = boto3.client(
        "s3",
        endpoint_url=ENDPOINT,
        aws_access_key_id=AK,
        aws_secret_access_key=SK,
        region_name=REGION,
        config=Config(signature_version='s3v4')
    )
    
    test_key = "test/diagnostic_s3v4.txt"
    test_content = b"Test upload with s3v4 signature"
    
    client2.put_object(
        Bucket=BUCKET,
        Key=test_key,
        Body=io.BytesIO(test_content)
    )
    print(f"✅ 上传成功: {test_key}")
except Exception as e:
    print(f"❌ 失败: {e}")

# 测试3: 不指定region
print("\n[测试3] 不指定region...")
try:
    client3 = boto3.client(
        "s3",
        endpoint_url=ENDPOINT,
        aws_access_key_id=AK,
        aws_secret_access_key=SK
    )
    
    test_key = "test/diagnostic_no_region.txt"
    test_content = b"Test upload without region"
    
    client3.put_object(
        Bucket=BUCKET,
        Key=test_key,
        Body=io.BytesIO(test_content)
    )
    print(f"✅ 上传成功: {test_key}")
except Exception as e:
    print(f"❌ 失败: {e}")

# 测试4: ListObjects权限
print("\n[测试4] 测试ListObjects权限...")
try:
    response = client2.list_objects_v2(Bucket=BUCKET, MaxKeys=1)
    print(f"✅ 有ListObjects权限")
except Exception as e:
    print(f"❌ 无ListObjects权限: {e}")

print("\n" + "=" * 60)
print("诊断完成！")
print("=" * 60)
