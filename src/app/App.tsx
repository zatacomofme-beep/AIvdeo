import React from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MainWorkspace } from './components/MainWorkspace';
import { DirectorPanel } from './components/DirectorPanel';
import { CreateProductPanel } from './components/CreateProductPanel';
import { LoginModal } from './components/LoginModal';
import { UserCenter } from './components/UserCenter';
import { RechargeModal } from './components/RechargeModal';
import { MyVideos } from './components/assets/MyVideos';
import { MyPrompts } from './components/assets/MyPrompts';
import { MyProducts } from './components/assets/MyProducts';
import { MyCharacters } from './components/assets/MyCharacters';
import { ContentSquare } from './components/ContentSquare';
import { AdminPanel } from './components/AdminPanel';  // 新增：管理员面板
import { useStore } from './lib/store';

export default function App() {
  const [activeTab, setActiveTab] = React.useState('video');
  const [showLogin, setShowLogin] = React.useState(false);
  const [showUserCenter, setShowUserCenter] = React.useState(false);
  const [showRecharge, setShowRecharge] = React.useState(false);
  
  const { login, register, logout, addCredits } = useStore();

  const handleLogin = async (email: string, password: string) => {
    // TODO: 调用后端API进行登录验证
    // 这里是模拟登录
    
    // ✅ 管理员测试账号
    const isAdmin = email === 'admin@soradirector.com';
    
    const mockUser = {
      id: Date.now().toString(),
      email,
      username: email.split('@')[0],
      createdAt: Date.now(),
      role: isAdmin ? 'admin' as const : 'user' as const  // 设置角色
    };
    
    login(mockUser);
    setShowLogin(false);
    
    if (isAdmin) {
      alert('✅ 管理员登录成功！\n\n您现在可以访问：\n• 管理员控制台（侧边栏）\n• 用户管理\n• 视频审核\n• 提示词管理');
    } else {
      alert('✅ 登录成功！');
    }
  };

  const handleRegister = async (email: string, password: string, username: string) => {
    // TODO: 调用后端API进行注册
    // 这里是模拟注册
    const mockUser = {
      id: Date.now().toString(),
      email,
      username,
      createdAt: Date.now()
    };
    
    register(mockUser);
    // 新用户赠送100 Credits
    addCredits(100);
    setShowLogin(false);
    alert('✅ 注册成功！获得新用户奖励 100 Credits');
  };

  const handleLogout = () => {
    logout();
    setShowUserCenter(false);
    alert('已退出登录');
  };

  const handleRecharge = (amount: number, credits: number, method: string) => {
    // TODO: 调用后端API进行充值
    addCredits(credits);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'video':
        return <MainWorkspace />;
      case 'square':
        return <ContentSquare />;
      case 'my-videos':
        return <MyVideos />;
      case 'my-prompts':
        return <MyPrompts />;
      case 'my-products':
        return <MyProducts />;
      case 'my-characters':
        return <MyCharacters />;
      case 'admin':  // 新增：管理员面板
        return <AdminPanel />;
      default:
        return <MainWorkspace />;
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex overflow-hidden relative">
      {/* Diffuse Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-200/40 blur-[120px] animate-float pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-200/40 blur-[120px] animate-float-delayed pointer-events-none z-0" />
      <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] rounded-full bg-cyan-200/40 blur-[100px] animate-float pointer-events-none z-0" />

      {/* Background Grid Overlay (Optional for Cyberpunk feel) */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-0 mix-blend-multiply"></div>

      {/* Left Sidebar */}
      <div className="relative z-10 flex h-full">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onOpenLogin={() => setShowLogin(true)}
        onOpenUserCenter={() => setShowUserCenter(true)}
        onOpenRecharge={() => setShowRecharge(true)}
      />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Bar */}
        <TopBar />

        {/* Workspace */}
        {renderContent()}
      </div>

      {/* AI Director Panel */}
      <DirectorPanel />

      {/* Create Product Panel */}
      <CreateProductPanel />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* User Center */}
      <UserCenter
        isOpen={showUserCenter}
        onClose={() => setShowUserCenter(false)}
        onLogout={handleLogout}
      />

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={showRecharge}
        onClose={() => setShowRecharge(false)}
        onRecharge={handleRecharge}
      />
    </div>
  );
}