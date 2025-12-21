# 📤 GitHub 上传指南

## 方法一：通过命令行上传（推荐）

### 前置准备

1. **确认已安装 Git**
```bash
git --version
# 如果未安装，访问 https://git-scm.com/downloads
```

2. **配置 Git 用户信息**（首次使用）
```bash
git config --global user.name "你的GitHub用户名"
git config --global user.email "你的GitHub邮箱"
```

---

### Step 1: 在 GitHub 上创建仓库

1. 登录 GitHub: https://github.com
2. 点击右上角 "+" → "New repository"
3. 填写仓库信息：
   - Repository name: `AIvideo` 或 `SoraDirector`
   - Description: `AI视频导演系统 - 电商产品UGC视频生成工具`
   - 选择 **Public** 或 **Private**
   - ❌ **不要**勾选 "Initialize this repository with a README"
   - ❌ **不要**添加 .gitignore（我们已经创建了）
4. 点击 "Create repository"

---

### Step 2: 初始化本地仓库

在项目根目录打开终端，执行以下命令：

```bash
# 1. 初始化 Git 仓库
git init

# 2. 添加所有文件到暂存区
git add .

# 3. 查看文件状态（可选）
git status

# 4. 提交所有文件
git commit -m "🎉 Initial commit: SoraDirector AI视频导演系统

✨ Features:
- 黑色赛博朋克风格UI
- 三步骤视频创作流程
- 完整的后端API集成
- Credits积分系统
- GPT-4o Vision + Sora集成
- TOS图片存储集成

🔌 API Integration:
- 图片上传到TOS
- AI脚本生成
- 视频生成与轮询
- 用户积分管理

📦 Tech Stack:
- React 18 + TypeScript
- Tailwind CSS v4
- Zustand状态管理
- FastAPI后端集成"
```

---

### Step 3: 连接到 GitHub 仓库

**替换下面的 `YOUR_USERNAME` 和 `YOUR_REPO` 为你的实际仓库信息**

```bash
# 方式1: HTTPS（推荐，适合首次使用）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 方式2: SSH（需要配置SSH密钥）
# git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

**示例**：
```bash
# 如果你的GitHub用户名是 zatacomofme-beep，仓库名是 AIvideo
git remote add origin https://github.com/zatacomofme-beep/AIvideo.git
```

验证远程仓库：
```bash
git remote -v
```

---

### Step 4: 推送代码到 GitHub

```bash
# 推送到 main 分支
git push -u origin main

# 如果遇到错误说 main 不存在，使用 master
# git branch -M main
# git push -u origin main
```

**如果遇到认证问题**：
- GitHub 不再支持密码认证
- 需要使用 **Personal Access Token (PAT)**

#### 创建 Personal Access Token:

1. GitHub → 右上角头像 → Settings
2. 左侧菜单 → Developer settings → Personal access tokens → Tokens (classic)
3. "Generate new token" → "Generate new token (classic)"
4. 设置：
   - Note: `SoraDirector Upload`
   - Expiration: `90 days` 或更长
   - 勾选: `repo` (完整的仓库访问权限)
5. 点击 "Generate token"
6. **复制 token**（只显示一次！）

#### 使用 Token 推送:

```bash
# 在提示输入密码时，粘贴 token（不是你的 GitHub 密码）
git push -u origin main

# Username: 你的GitHub用户名
# Password: 粘贴你的 Personal Access Token
```

---

### Step 5: 验证上传成功

访问你的 GitHub 仓库页面：
```
https://github.com/YOUR_USERNAME/YOUR_REPO
```

你应该看到所有文件已经上传！

---

## 方法二：通过 GitHub Desktop（图形界面）

### Step 1: 安装 GitHub Desktop

下载：https://desktop.github.com/

### Step 2: 登录 GitHub 账号

打开 GitHub Desktop → File → Options → Accounts → Sign in

### Step 3: 添加本地仓库

1. File → Add local repository
2. 选择你的项目文件夹
3. 如果提示"未初始化"，点击 "create a repository"

### Step 4: 创建初始提交

1. 左下角 "Summary" 输入: `Initial commit: SoraDirector`
2. 点击 "Commit to main"

### Step 5: 发布到 GitHub

1. 点击顶部 "Publish repository"
2. 填写：
   - Name: `AIvideo` 或 `SoraDirector`
   - Description: `AI视频导演系统`
   - 选择 Public 或 Private
3. 点击 "Publish Repository"

---

## 方法三：通过 GitHub 网页直接上传（适合小项目）

⚠️ **不推荐**：项目文件较多，网页上传容易出错

1. 在 GitHub 创建新仓库
2. 点击 "uploading an existing file"
3. 拖拽文件到页面
4. 填写 commit 信息
5. 点击 "Commit changes"

---

## 📋 检查清单

上传前确认：

- [x] `.gitignore` 文件已创建（防止上传 node_modules）
- [x] `.env` 文件不会被上传（已在 .gitignore 中）
- [x] `.env.example` 文件会被上传（供他人参考）
- [x] `node_modules/` 文件夹不会被上传
- [x] 所有源代码文件都在项目中

---

## 🔄 后续更新代码

修改代码后，重新上传：

```bash
# 1. 查看修改的文件
git status

# 2. 添加修改的文件
git add .

# 3. 提交修改
git commit -m "描述你的修改内容"

# 4. 推送到 GitHub
git push
```

**示例**：
```bash
git add .
git commit -m "✨ 添加视频预览功能"
git push
```

---

## 📝 推荐的 Commit 信息格式

```bash
# 新功能
git commit -m "✨ feat: 添加用户登录功能"

# 修复Bug
git commit -m "🐛 fix: 修复图片上传失败的问题"

# 文档更新
git commit -m "📝 docs: 更新API集成文档"

# 样式调整
git commit -m "💄 style: 优化按钮样式"

# 性能优化
git commit -m "⚡ perf: 优化视频轮询性能"

# 重构
git commit -m "♻️ refactor: 重构DirectorPanel组件"
```

---

## 🚨 常见问题

### 问题1: `fatal: not a git repository`
```bash
# 解决方法：初始化仓库
git init
```

### 问题2: `remote origin already exists`
```bash
# 解决方法：删除旧的远程仓库，重新添加
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### 问题3: `failed to push some refs`
```bash
# 解决方法：先拉取远程代码，再推送
git pull origin main --rebase
git push -u origin main
```

### 问题4: `Permission denied`
- 确认你有仓库的写权限
- 检查 Personal Access Token 是否正确
- 确认 Token 有 `repo` 权限

### 问题5: `node_modules` 文件夹太大
- 确认 `.gitignore` 文件存在
- 如果已经提交了，使用：
```bash
git rm -r --cached node_modules
git commit -m "🗑️ 移除 node_modules"
git push
```

---

## 📦 完整上传命令（复制粘贴版）

**将 `YOUR_USERNAME` 和 `YOUR_REPO` 替换为你的实际信息**

```bash
# 初始化仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "🎉 Initial commit: SoraDirector AI视频导演系统"

# 连接远程仓库（替换下面的链接）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 推送
git push -u origin main
```

---

## 🎯 完成后

上传成功后，你可以：

1. **分享仓库链接**
   ```
   https://github.com/YOUR_USERNAME/YOUR_REPO
   ```

2. **添加 README Badge**（可选）
   在 README.md 顶部添加：
   ```markdown
   ![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/YOUR_REPO?style=social)
   ![GitHub forks](https://img.shields.io/github/forks/YOUR_USERNAME/YOUR_REPO?style=social)
   ```

3. **设置 GitHub Pages**（如果需要）
   Settings → Pages → Source: main branch

4. **邀请协作者**
   Settings → Collaborators → Add people

---

## 📞 需要帮助？

如果遇到问题：
1. 查看错误信息
2. 搜索 GitHub 文档：https://docs.github.com
3. 检查本指南的"常见问题"部分

---

**祝你上传顺利！** 🚀
