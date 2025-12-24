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
import { AdminPanel } from './components/AdminPanel';
import { NineGridGenerator } from './components/NineGridGenerator';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { ContactUs } from './components/ContactUs';
import { useStore } from './lib/store';
import { api } from '../lib/api';
import { ToastProvider, useToast } from './components/ui/toast';

function AppContent() {
  const [activeTab, setActiveTab] = React.useState('video');
  const [showLogin, setShowLogin] = React.useState(false);
  const [showUserCenter, setShowUserCenter] = React.useState(false);
  const [showRecharge, setShowRecharge] = React.useState(false);
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [showTerms, setShowTerms] = React.useState(false);
  const [showContact, setShowContact] = React.useState(false);
  
  const { login, register, logout, addCredits, loadUserData } = useStore();
  const toast = useToast();

  const handleLogin = async (email: string, password: string) => {
    console.log('[handleLogin] 开始执行...');
    try {
      // 调用后端 API 进行登录
      console.log('[handleLogin] 调用 API...');
      const response = await api.login({ email, password });
      console.log('[handleLogin] API 返回成功:', response);
      
      // 登录成功后，主动拉取最新积分余额（容错处理）
      let finalCredits = response.user.credits;  // 默认使用登录返回的积分
      console.log('[handleLogin] 拉取最新积分...');
      const balanceResponse = await api.getCreditsBalance(response.user.id);
      if (balanceResponse) {
        console.log('[handleLogin] 最新积分:', balanceResponse.credits);
        finalCredits = balanceResponse.credits;
      } else {
        console.warn('[handleLogin] 积分API返回null，使用登录返回的积分');
      }
      
      // 保存用户信息到 store（使用最新积分）
      console.log('[handleLogin] 保存用户信息...');
      login({
        ...response.user,
        credits: finalCredits  // 使用从数据库拉取的最新积分（或登录返回的积分）
      });
      
      // ✅ 加载用户的角色和商品数据
      console.log('[handleLogin] 加载用户数据...');
      await loadUserData(response.user.id);
      
      // 先关闭弹窗，然后显示提示
      console.log('[handleLogin] 关闭弹窗...');
      setShowLogin(false);
      
      if (response.user.role === 'admin') {
        toast.success('管理员登录成功', '您现在可以访问：\n• 管理员控制台（侧边栏）\n• 用户管理\n• 视频审核\n• 提示词管理');
      } else {
        toast.success('登录成功', `欢迎回来，${response.user.username}！\n当前积分：${finalCredits}`);
      }
      
      console.log('[handleLogin] 登录流程完成');
    } catch (error) {
      console.error('[handleLogin] 错误:', error);
      toast.error('登录失败', error instanceof Error ? error.message : '请稍后重试');
    }
  };

  const handleRegister = async (email: string, password: string, username: string) => {
    try {
      // 调用后端 API 进行注册
      const response = await api.register({ email, password, username });
      
      // 注册成功，保存用户信息到 store
      register(response.user);
      
      setShowLogin(false);
      toast.success('注册成功', `${response.message}\n用户ID：${response.user.id}\n初始积分：${response.user.credits}`);
    } catch (error) {
      toast.error('注册失败', error instanceof Error ? error.message : '请稍后重试');
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserCenter(false);
    toast.info('已退出登录', '');
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
      case 'nine-grid':
        return <NineGridGenerator />;
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
    <div className="h-screen w-screen bg-[#F8FAFC] text-slate-900 flex overflow-hidden relative">
      {/* Business Tech: 去除光球和渐变背景，使用纯色 */}

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
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>

        {/* Footer */}
        <Footer
          onOpenPrivacy={() => setShowPrivacy(true)}
          onOpenTerms={() => setShowTerms(true)}
          onOpenContact={() => setShowContact(true)}
        />
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

      {/* Privacy Policy */}
      <PrivacyPolicy
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />

      {/* Terms of Service */}
      <TermsOfService
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />

      {/* Contact Us */}
      <ContactUs
        isOpen={showContact}
        onClose={() => setShowContact(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}