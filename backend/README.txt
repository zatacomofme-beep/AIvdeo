SoraDirector 后端部署说明
============================

一、在火山云服务器上部署
------------------------

1. 安装 Python 环境（如果还没有）
   yum install python3 python3-pip -y

2. 上传后端代码到服务器
   scp -r backend/ root@你的服务器IP:/root/soradirector-backend/

3. 在服务器上安装依赖
   cd /root/soradirector-backend
   pip3 install -r requirements.txt

4. 配置环境变量
   复制 .env.example 为 .env：
   cp .env.example .env
   
   编辑 .env 填写实际的 AK/SK：
   vi .env
   
   或者直接在启动前 export：
   export TOS_ACCESS_KEY="你的AK"
   export TOS_SECRET_KEY="你的SK"

5. 启动服务
   方式一（直接启动）：
   uvicorn main:app --host 0.0.0.0 --port 8000
   
   方式二（使用脚本）：
   chmod +x start.sh
   ./start.sh
   
   方式三（后台运行）：
   nohup uvicorn main:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &

6. 检查服务是否启动成功
   curl http://localhost:8000/health
   
   如果返回 {"status":"ok"} 说明启动成功

7. 开放防火墙端口
   在火山云控制台 -> 安全组 -> 添加入站规则：
   - 端口：8000
   - 协议：TCP
   - 源地址：0.0.0.0/0（或者只允许你的前端服务器 IP）


二、前端配置
-----------

1. 在前端项目根目录创建 .env 文件：
   复制 .env.example 为 .env
   
2. 修改 VITE_API_URL 为你的后端地址：
   VITE_API_URL=http://你的服务器公网IP:8000

3. 重启前端开发服务器
   npm run dev


三、测试接口
-----------

1. 测试上传图片：
   curl -X POST "http://你的服务器IP:8000/upload-image" \
     -F "file=@test.jpg"

2. 访问 API 文档：
   http://你的服务器IP:8000/docs


四、常见问题
-----------

Q: 上传失败，提示 TOS 相关错误
A: 检查 AK/SK 是否正确，TOS 桶是否存在，桶是否在北京地域

Q: 前端无法连接后端
A: 检查防火墙 8000 端口是否开放，检查 CORS 配置

Q: 图片上传后无法访问
A: 检查 TOS 桶的访问权限设置，确保允许公开读取
