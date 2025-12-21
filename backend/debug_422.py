import requests

# 测试1: 正常的multipart/form-data上传
print("=" * 60)
print("测试1: 标准文件上传")
print("=" * 60)
files = {'file': ('test.png', b'\x89PNG\r\n\x1a\n', 'image/png')}
try:
    r = requests.post('http://115.190.137.87:8000/api/upload-image', files=files)
    print(f"状态码: {r.status_code}")
    print(f"响应: {r.text}")
except Exception as e:
    print(f"错误: {e}")

# 测试2: 检查OPTIONS请求（CORS预检）
print("\n" + "=" * 60)
print("测试2: OPTIONS预检请求")
print("=" * 60)
try:
    r = requests.options('http://115.190.137.87:8000/api/upload-image')
    print(f"状态码: {r.status_code}")
    print(f"Headers: {dict(r.headers)}")
except Exception as e:
    print(f"错误: {e}")

# 测试3: 带Origin头的请求（模拟浏览器）
print("\n" + "=" * 60)
print("测试3: 带Origin头的浏览器请求")
print("=" * 60)
files = {'file': ('test.png', b'\x89PNG\r\n\x1a\n', 'image/png')}
headers = {
    'Origin': 'http://localhost:5173',
}
try:
    r = requests.post('http://115.190.137.87:8000/api/upload-image', 
                     files=files, 
                     headers=headers)
    print(f"状态码: {r.status_code}")
    print(f"响应: {r.text}")
except Exception as e:
    print(f"错误: {e}")

# 测试4: 不带文件的请求（看看422错误信息）
print("\n" + "=" * 60)
print("测试4: 空请求（触发422错误）")
print("=" * 60)
try:
    r = requests.post('http://115.190.137.87:8000/api/upload-image')
    print(f"状态码: {r.status_code}")
    print(f"响应: {r.text}")
except Exception as e:
    print(f"错误: {e}")

# 测试5: 错误的字段名
print("\n" + "=" * 60)
print("测试5: 错误的字段名（wrongfield而不是file）")
print("=" * 60)
files = {'wrongfield': ('test.png', b'\x89PNG\r\n\x1a\n', 'image/png')}
try:
    r = requests.post('http://115.190.137.87:8000/api/upload-image', files=files)
    print(f"状态码: {r.status_code}")
    print(f"响应: {r.text}")
except Exception as e:
    print(f"错误: {e}")
