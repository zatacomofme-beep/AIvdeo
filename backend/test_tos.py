#!/usr/bin/env python3
"""
测试火山云 TOS 连接和文件上传
使用前请先配置环境变量：
export TOS_ACCESS_KEY="你的AK"
export TOS_SECRET_KEY="你的SK"
"""

import os
import boto3

# 配置
TOS_ENDPOINT = "https://tos-cn-beijing.volces.com"
TOS_REGION = "cn-beijing"
TOS_BUCKET = "sora-2"

TOS_ACCESS_KEY = os.getenv("TOS_ACCESS_KEY")
TOS_SECRET_KEY = os.getenv("TOS_SECRET_KEY")

if not TOS_ACCESS_KEY or not TOS_SECRET_KEY:
    print("错误: 请先设置 TOS_ACCESS_KEY 和 TOS_SECRET_KEY 环境变量")
    exit(1)

# 创建客户端
s3_client = boto3.client(
    "s3",
    endpoint_url=TOS_ENDPOINT,
    aws_access_key_id=TOS_ACCESS_KEY,
    aws_secret_access_key=TOS_SECRET_KEY,
    region_name=TOS_REGION,
)

print(f"正在测试连接到火山云 TOS...")
print(f"  桶名: {TOS_BUCKET}")
print(f"  地域: {TOS_REGION}")
print(f"  Endpoint: {TOS_ENDPOINT}")

try:
    # 测试列出桶内文件（只列出前 10 个）
    response = s3_client.list_objects_v2(Bucket=TOS_BUCKET, MaxKeys=10)
    
    print(f"\n✅ 连接成功！")
    print(f"\n桶内文件数量: {response.get('KeyCount', 0)}")
    
    if 'Contents' in response:
        print("\n前 10 个文件:")
        for obj in response['Contents'][:10]:
            print(f"  - {obj['Key']} ({obj['Size']} bytes)")
    else:
        print("\n桶为空或无权限查看文件列表")
        
    # 测试生成公开访问 URL
    test_key = "test/example.jpg"
    url = f"https://{TOS_BUCKET}.{TOS_ENDPOINT.replace('https://', '')}/{test_key}"
    print(f"\n示例文件访问 URL 格式:")
    print(f"  {url}")
    
except Exception as e:
    print(f"\n❌ 连接失败: {e}")
    print("\n请检查:")
    print("  1. AK/SK 是否正确")
    print("  2. 桶名是否存在")
    print("  3. 桶所在地域是否为北京")
    print("  4. 网络连接是否正常")
