#!/usr/bin/env python3
"""
火山云 TOS 诊断脚本
用于测试 TOS 连接和权限配置
"""

import os
import sys
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# TOS 配置
TOS_ENDPOINT = os.getenv("TOS_ENDPOINT", "https://tos-cn-beijing.volces.com")
TOS_REGION = os.getenv("TOS_REGION", "cn-beijing")
TOS_BUCKET = os.getenv("TOS_BUCKET", "sora-2")
TOS_ACCESS_KEY = os.getenv("TOS_ACCESS_KEY")
TOS_SECRET_KEY = os.getenv("TOS_SECRET_KEY")

print("=" * 60)
print("火山云 TOS 配置诊断")
print("=" * 60)
print()

# 1. 检查环境变量
print("📋 步骤 1: 检查环境变量配置")
print("-" * 60)
print(f"TOS_ENDPOINT:    {TOS_ENDPOINT}")
print(f"TOS_REGION:      {TOS_REGION}")
print(f"TOS_BUCKET:      {TOS_BUCKET}")

if not TOS_ACCESS_KEY or not TOS_SECRET_KEY:
    print("\n❌ 错误: TOS_ACCESS_KEY 或 TOS_SECRET_KEY 未配置!")
    print("\n请在 backend/.env 文件中配置:")
    print("  TOS_ACCESS_KEY=你的AccessKey")
    print("  TOS_SECRET_KEY=你的SecretKey")
    sys.exit(1)

print(f"TOS_ACCESS_KEY:  {TOS_ACCESS_KEY[:10]}***{TOS_ACCESS_KEY[-5:] if len(TOS_ACCESS_KEY) > 15 else '***'}")
print(f"TOS_SECRET_KEY:  {TOS_SECRET_KEY[:10]}***{TOS_SECRET_KEY[-5:] if len(TOS_SECRET_KEY) > 15 else '***'}")
print("✅ 环境变量已配置")
print()

# 2. 创建 S3 客户端
print("📋 步骤 2: 创建 boto3 S3 客户端")
print("-" * 60)
try:
    s3_client = boto3.client(
        "s3",
        endpoint_url=TOS_ENDPOINT,
        aws_access_key_id=TOS_ACCESS_KEY,
        aws_secret_access_key=TOS_SECRET_KEY,
        region_name=TOS_REGION,
        config=Config(signature_version='s3v4')
    )
    print("✅ S3 客户端创建成功")
    print()
except Exception as e:
    print(f"❌ 创建 S3 客户端失败: {e}")
    sys.exit(1)

# 3. 测试列出桶
print("📋 步骤 3: 测试列出所有桶 (ListBuckets)")
print("-" * 60)
try:
    response = s3_client.list_buckets()
    buckets = [b['Name'] for b in response.get('Buckets', [])]
    print(f"✅ 成功列出 {len(buckets)} 个桶:")
    for bucket in buckets:
        marker = " ← 目标桶" if bucket == TOS_BUCKET else ""
        print(f"   - {bucket}{marker}")
    
    if TOS_BUCKET not in buckets:
        print(f"\n⚠️  警告: 目标桶 '{TOS_BUCKET}' 不在列表中!")
        print("   可能的原因:")
        print("   1. 桶名拼写错误")
        print("   2. 桶在其他区域")
        print("   3. AK/SK 没有访问该桶的权限")
    print()
except ClientError as e:
    error_code = e.response['Error']['Code']
    error_msg = e.response['Error']['Message']
    print(f"❌ API 错误: {error_code}")
    print(f"   错误信息: {error_msg}")
    
    if error_code == 'InvalidAccessKeyId':
        print("\n💡 解决方案:")
        print("   - 检查 TOS_ACCESS_KEY 是否正确")
        print("   - 确保在火山引擎控制台生成的密钥仍然有效")
    elif error_code == 'SignatureDoesNotMatch':
        print("\n💡 解决方案:")
        print("   - 检查 TOS_SECRET_KEY 是否正确")
        print("   - 确保没有多余的空格或换行符")
    sys.exit(1)
except Exception as e:
    print(f"❌ 未知错误: {type(e).__name__}: {e}")
    sys.exit(1)

# 4. 测试上传权限
print("📋 步骤 4: 测试上传权限 (PutObject)")
print("-" * 60)
test_key = "test/diagnostic_test.txt"
test_content = "这是一个诊断测试文件".encode('utf-8')

try:
    s3_client.put_object(
        Bucket=TOS_BUCKET,
        Key=test_key,
        Body=test_content,
        ContentType='text/plain'
    )
    print(f"✅ 成功上传测试文件: {test_key}")
    print()
except ClientError as e:
    error_code = e.response['Error']['Code']
    error_msg = e.response['Error']['Message']
    print(f"❌ 上传失败: {error_code}")
    print(f"   错误信息: {error_msg}")
    
    if error_code == 'AccessDenied' or error_code == 'Forbidden':
        print("\n💡 这就是 403 错误的原因!")
        print("\n可能的解决方案:")
        print("1. 检查火山引擎控制台的 IAM 权限:")
        print("   - 登录 https://console.volcengine.com/iam/keymanage/")
        print("   - 确保当前 AK/SK 有 TOS 的 PutObject 权限")
        print()
        print("2. 检查 TOS 桶的访问控制:")
        print("   - 登录 https://console.volcengine.com/tos/bucket/")
        print(f"   - 进入桶 '{TOS_BUCKET}' 的权限设置")
        print("   - 确保桶策略允许 PutObject 操作")
        print()
        print("3. 检查桶的区域是否匹配:")
        print(f"   - 当前配置区域: {TOS_REGION}")
        print("   - 确保桶确实在北京(cn-beijing)区域")
    elif error_code == 'NoSuchBucket':
        print(f"\n💡 桶 '{TOS_BUCKET}' 不存在!")
        print("   - 请在火山引擎控制台创建该桶")
        print("   - 或修改 .env 中的 TOS_BUCKET 配置")
    
    sys.exit(1)
except Exception as e:
    print(f"❌ 未知错误: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 5. 测试读取权限
print("📋 步骤 5: 测试读取权限 (GetObject)")
print("-" * 60)
try:
    response = s3_client.get_object(Bucket=TOS_BUCKET, Key=test_key)
    content = response['Body'].read()
    print(f"✅ 成功读取测试文件")
    print(f"   内容: {content.decode('utf-8')}")
    print()
except ClientError as e:
    print(f"❌ 读取失败: {e.response['Error']['Code']}")
    print(f"   错误信息: {e.response['Error']['Message']}")
    sys.exit(1)

# 6. 清理测试文件
print("📋 步骤 6: 清理测试文件")
print("-" * 60)
try:
    s3_client.delete_object(Bucket=TOS_BUCKET, Key=test_key)
    print(f"✅ 成功删除测试文件")
    print()
except ClientError as e:
    print(f"⚠️  删除失败: {e.response['Error']['Code']}")
    print(f"   (不影响功能，可手动删除)")
    print()

# 7. 生成公开访问 URL 测试
print("📋 步骤 7: 测试公开访问 URL 格式")
print("-" * 60)
endpoint = TOS_ENDPOINT.replace("https://", "").replace("http://", "")
public_url = f"https://{TOS_BUCKET}.{endpoint}/test/example.jpg"
print(f"URL 格式: {public_url}")
print()

# 总结
print("=" * 60)
print("✅ 诊断完成! 所有测试通过")
print("=" * 60)
print()
print("您的 TOS 配置正常，可以正常上传图片。")
print()
print("如果前端仍然报 403 错误，请检查:")
print("1. 前端的 VITE_API_URL 是否正确指向后端地址")
print("2. 后端服务是否正常启动 (curl http://localhost:8000/health)")
print("3. 网络防火墙是否阻止了请求")
