import requests

# 创建一个小测试图片
test_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde'

# 测试上传
files = {'file': ('test.png', test_image, 'image/png')}

print("测试 /upload-image...")
try:
    r = requests.post('http://115.190.137.87:8000/upload-image', files=files)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"错误: {e}")

print("\n测试 /api/upload-image...")
try:
    r = requests.post('http://115.190.137.87:8000/api/upload-image', files=files)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"错误: {e}")
