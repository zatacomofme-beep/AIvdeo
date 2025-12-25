import React from 'react';
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Avatar,
  Progress
} from '@heroui/react';
import { Sparkles, Settings, User } from 'lucide-react';

/**
 * HeroUI 组件示例页面
 * 展示如何在项目中使用 HeroUI 组件
 */
export function HeroUIExample() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
          <Sparkles className="text-tech" size={32} />
          HeroUI 组件示例
        </h1>
        <p className="text-slate-600">
          以下展示了 HeroUI 的常用组件，你可以在项目中直接使用
        </p>
      </div>

      {/* 按钮示例 */}
      <Card>
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-lg font-semibold">按钮组件 (Button)</p>
            <p className="text-sm text-slate-500">不同样式和大小的按钮</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-4">
            <Button color="primary" variant="solid">
              主要按钮
            </Button>
            <Button color="secondary" variant="flat">
              次要按钮
            </Button>
            <Button color="success" variant="bordered">
              成功按钮
            </Button>
            <Button color="warning" variant="light">
              警告按钮
            </Button>
            <Button color="danger" variant="ghost">
              危险按钮
            </Button>
            <Button isLoading>
              加载中
            </Button>
            <Button startContent={<Sparkles size={16} />}>
              带图标
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 输入框示例 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col">
            <p className="text-lg font-semibold">输入框组件 (Input)</p>
            <p className="text-sm text-slate-500">表单输入控件</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              label="用户名"
              placeholder="请输入用户名"
            />
            <Input
              type="email"
              label="邮箱"
              placeholder="example@mail.com"
              variant="bordered"
            />
            <Input
              type="password"
              label="密码"
              placeholder="请输入密码"
              variant="flat"
            />
            <Input
              type="text"
              label="带图标"
              placeholder="搜索..."
              startContent={<User size={16} />}
            />
          </div>
        </CardBody>
      </Card>

      {/* 卡片和标签示例 */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-lg font-semibold">进度条</p>
                <p className="text-sm text-slate-500">Progress</p>
              </div>
              <Chip color="success" variant="flat">完成 75%</Chip>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Progress
                aria-label="Loading..."
                value={75}
                color="primary"
                showValueLabel={true}
              />
              <Progress
                aria-label="Processing..."
                value={50}
                color="secondary"
              />
              <Progress
                aria-label="Success"
                value={100}
                color="success"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="text-lg font-semibold">标签和头像</p>
              <p className="text-sm text-slate-500">Chip & Avatar</p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Chip color="primary" variant="flat">Primary</Chip>
                <Chip color="secondary" variant="dot">Secondary</Chip>
                <Chip color="success">Success</Chip>
                <Chip color="warning" variant="bordered">Warning</Chip>
                <Chip color="danger" variant="light">Danger</Chip>
              </div>
              <div className="flex gap-3">
                <Avatar name="用户 A" />
                <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
                <Avatar name="B" size="sm" />
                <Avatar name="C" size="lg" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 下拉菜单和模态框 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col">
            <p className="text-lg font-semibold">下拉菜单和模态框</p>
            <p className="text-sm text-slate-500">Dropdown & Modal</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex gap-4">
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  variant="bordered" 
                  endContent={<Settings size={16} />}
                >
                  打开菜单
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Actions">
                <DropdownItem key="new">新建文件</DropdownItem>
                <DropdownItem key="copy">复制链接</DropdownItem>
                <DropdownItem key="edit">编辑文件</DropdownItem>
                <DropdownItem key="delete" className="text-danger" color="danger">
                  删除文件
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <Button onPress={onOpen} color="primary">
              打开模态框
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 模态框组件 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            HeroUI 模态框示例
          </ModalHeader>
          <ModalBody>
            <p className="text-slate-600">
              这是一个使用 HeroUI 的模态框组件。你可以在这里放置任何内容。
            </p>
            <Input
              label="邮箱"
              placeholder="请输入邮箱"
              type="email"
            />
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

      {/* 使用说明 */}
      <Card className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-tech flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">开始使用 HeroUI</p>
              <p className="text-sm text-slate-600">在你的组件中导入并使用</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="bg-slate-900 text-white p-4 rounded-lg font-mono text-sm">
            <pre>{`import { Button, Card, Input } from '@heroui/react';

export function MyComponent() {
  return (
    <Card>
      <Input label="用户名" />
      <Button color="primary">提交</Button>
    </Card>
  );
}`}</pre>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
