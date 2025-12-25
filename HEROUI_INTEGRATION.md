# HeroUI 集成指南

## 📦 已完成的集成步骤

### ✅ 1. 依赖包安装

需要安装以下包：

```bash
npm install @heroui/react framer-motion
```

### ✅ 2. Tailwind 配置更新

已在 `tailwind.config.js` 中添加 HeroUI 插件：

```javascript
import { heroui } from "@heroui/react";

export default {
  // ... 其他配置
  plugins: [
    require("tailwindcss-animate"),
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#0ea5e9",
              foreground: "#ffffff",
            },
          },
        },
      },
    }),
  ],
};
```

### ✅ 3. Provider 配置

已在 `src/app/App.tsx` 中添加 `HeroUIProvider`：

```tsx
import { HeroUIProvider } from '@heroui/react';

export default function App() {
  return (
    <HeroUIProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </HeroUIProvider>
  );
}
```

---

## 🎨 可用的 HeroUI 组件

### 基础组件

- **Button** - 按钮
- **Card** - 卡片
- **Input** - 输入框
- **Textarea** - 文本域
- **Select** - 下拉选择
- **Checkbox** - 复选框
- **Radio** - 单选框
- **Switch** - 开关

### 数据展示

- **Table** - 表格
- **Avatar** - 头像
- **Badge** - 徽章
- **Chip** - 标签
- **Progress** - 进度条
- **Skeleton** - 骨架屏

### 反馈组件

- **Modal** - 模态框
- **Toast** - 提示消息
- **Alert** - 警告提示
- **Tooltip** - 工具提示
- **Popover** - 气泡卡片

### 导航组件

- **Navbar** - 导航栏
- **Tabs** - 标签页
- **Breadcrumbs** - 面包屑
- **Pagination** - 分页
- **Dropdown** - 下拉菜单

### 表单组件

- **Form** - 表单
- **DatePicker** - 日期选择器
- **TimePicker** - 时间选择器
- **Slider** - 滑块
- **Input OTP** - 验证码输入

---

## 💡 使用示例

### 示例 1：基础按钮

```tsx
import { Button } from '@heroui/react';

export function MyComponent() {
  return (
    <div className="space-x-4">
      <Button color="primary">主要按钮</Button>
      <Button color="secondary" variant="flat">次要按钮</Button>
      <Button color="success" variant="bordered">成功</Button>
      <Button isLoading>加载中</Button>
    </div>
  );
}
```

### 示例 2：表单输入

```tsx
import { Input, Button, Card, CardBody } from '@heroui/react';
import { useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Card className="w-full max-w-md">
      <CardBody className="space-y-4">
        <Input
          type="email"
          label="邮箱"
          placeholder="请输入邮箱"
          value={email}
          onValueChange={setEmail}
        />
        <Input
          type="password"
          label="密码"
          placeholder="请输入密码"
          value={password}
          onValueChange={setPassword}
        />
        <Button color="primary" className="w-full">
          登录
        </Button>
      </CardBody>
    </Card>
  );
}
```

### 示例 3：模态框

```tsx
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';

export function ModalExample() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button onPress={onOpen}>打开模态框</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>确认操作</ModalHeader>
          <ModalBody>
            <p>您确定要执行此操作吗？</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              取消
            </Button>
            <Button color="primary" onPress={onClose}>
              确认
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
```

### 示例 4：下拉菜单

```tsx
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';

export function MenuExample() {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="bordered">操作</Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Actions">
        <DropdownItem key="new">新建</DropdownItem>
        <DropdownItem key="edit">编辑</DropdownItem>
        <DropdownItem key="delete" className="text-danger" color="danger">
          删除
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
```

---

## 🎯 在现有组件中使用 HeroUI

### 替换现有按钮

```tsx
// 之前：
<button className="btn-tech-ai px-6 py-3">
  提交
</button>

// 之后：
import { Button } from '@heroui/react';

<Button color="primary" size="lg" className="px-6">
  提交
</Button>
```

### 替换现有输入框

```tsx
// 之前：
<input
  type="text"
  className="w-full px-4 py-3 border rounded-md"
  placeholder="请输入"
/>

// 之后：
import { Input } from '@heroui/react';

<Input
  type="text"
  label="标题"
  placeholder="请输入"
  variant="bordered"
/>
```

### 替换现有卡片

```tsx
// 之前：
<div className="tech-card p-6">
  <h3>标题</h3>
  <p>内容</p>
</div>

// 之后：
import { Card, CardHeader, CardBody } from '@heroui/react';

<Card>
  <CardHeader>
    <h3>标题</h3>
  </CardHeader>
  <CardBody>
    <p>内容</p>
  </CardBody>
</Card>
```

---

## 📚 文档和资源

- **官方文档**: https://heroui.com/docs
- **组件库**: https://heroui.com/components
- **Storybook**: https://storybook.heroui.com
- **GitHub**: https://github.com/heroui-inc/heroui

---

## 🚀 下一步

1. **查看示例页面**：访问 `HeroUIExample` 组件查看所有组件的实际效果
2. **逐步替换**：可以逐步将现有组件替换为 HeroUI 组件
3. **自定义主题**：在 `tailwind.config.js` 中自定义 HeroUI 主题颜色
4. **阅读文档**：访问官方文档了解更多组件和用法

---

## ⚠️ 注意事项

1. **兼容性**：HeroUI 与现有的 Tailwind CSS 类完全兼容
2. **性能**：HeroUI 使用 Framer Motion 进行动画，已针对性能优化
3. **TypeScript**：HeroUI 完全支持 TypeScript
4. **SSR**：兼容 Next.js 等 SSR 框架

---

## 🛠️ 常见问题

### Q: HeroUI 会冲突我现有的 Tailwind 样式吗？

A: 不会。HeroUI 使用 `tailwind-variants` 自动处理类名冲突，你的自定义类会覆盖默认样式。

### Q: 我可以只使用部分组件吗？

A: 可以。虽然安装的是完整包，但打包时会自动 tree-shaking，只包含使用的组件。

### Q: 如何自定义主题颜色？

A: 在 `tailwind.config.js` 的 `heroui()` 插件配置中设置 `themes` 选项。

---

## 📝 示例页面位置

完整的 HeroUI 组件示例页面：
`src/app/components/HeroUIExample.tsx`

要查看示例页面，可以在侧边栏添加一个新的标签页指向这个组件。
