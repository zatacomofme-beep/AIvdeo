# ⚡ 快速上传到 GitHub

## 🚀 三种上传方式

---

## 方式一：自动化脚本（最简单）✅

### Mac/Linux:
```bash
chmod +x upload.sh
./upload.sh
```

### Windows:
双击运行 `upload.bat` 文件

或在命令行执行：
```cmd
upload.bat
```

**按照提示输入**：
1. GitHub 用户名（如：`zatacomofme-beep`）
2. 仓库名称（如：`AIvideo`）
3. 输入密码时使用 **Personal Access Token**（不是 GitHub 密码）

---

## 方式二：手动命令（推荐）✅

### Step 1: 在 GitHub 创建仓库

访问：https://github.com/new

- Repository name: `AIvideo`
- Description: `AI视频导演系统`
- Public 或 Private
- ❌ 不要勾选任何初始化选项

### Step 2: 在项目根目录执行命令

**复制下面的命令，替换 `YOUR_USERNAME` 为你的 GitHub 用户名**

```bash
# 初始化仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "🎉 Initial commit: SoraDirector"

# 连接远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/AIvideo.git

# 推送
git push -u origin main
```

**示例**（如果你的用户名是 zatacomofme-beep）：
```bash
git init
git add .
git commit -m "🎉 Initial commit: SoraDirector"
git remote add origin https://github.com/zatacomofme-beep/AIvideo.git
git push -u origin main
```

### Step 3: 输入认证信息

- Username: 你的 GitHub 用户名
- Password: **Personal Access Token**（不是密码！）

---

## 方式三：GitHub Desktop（图形界面）

1. 下载安装：https://desktop.github.com/
2. 登录 GitHub 账号
3. File → Add local repository → 选择项目文件夹
4. 创建 commit → Publish to GitHub

---

## 🔑 如何获取 Personal Access Token

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置：
   - Note: `SoraDirector Upload`
   - Expiration: `90 days`
   - 勾选: ✅ `repo` (完整仓库权限)
4. 点击 "Generate token"
5. **立即复制 token**（只显示一次！）

---

## ✅ 上传成功后

访问你的仓库：
```
https://github.com/YOUR_USERNAME/AIvideo
```

---

## 🔄 后续更新代码

修改代码后：

```bash
git add .
git commit -m "描述你的修改"
git push
```

示例：
```bash
git add .
git commit -m "✨ 添加视频预览功能"
git push
```

---

## 🚨 常见问题

### Q: `fatal: not a git repository`
```bash
git init
```

### Q: `remote origin already exists`
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### Q: `Permission denied` 或认证失败
- 确认使用的是 **Personal Access Token**，不是密码
- 检查 Token 权限是否包含 `repo`

### Q: `failed to push`
```bash
git pull origin main --rebase
git push -u origin main
```

---

## 📞 需要详细指南？

查看完整文档：
```bash
cat GITHUB_UPLOAD_GUIDE.md
```

或在线查看：[GITHUB_UPLOAD_GUIDE.md](./GITHUB_UPLOAD_GUIDE.md)

---

## 🎯 一键复制命令（最快方式）

**替换 `YOUR_USERNAME` 为你的 GitHub 用户名**

```bash
git init && git add . && git commit -m "🎉 Initial commit: SoraDirector" && git remote add origin https://github.com/YOUR_USERNAME/AIvideo.git && git push -u origin main
```

---

**准备好了吗？开始上传吧！** 🚀
