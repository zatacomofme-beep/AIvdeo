import React, { useState } from 'react';
import { 
  Home, 
  Video, 
  Image, 
  Mic, 
  Music, 
  Palette, 
  Heart, 
  Download,
  Plus,
  Folder,
  Film,
  MessageSquare,
  Package,
  ChevronDown,
  ChevronRight,
  User,
  Users,
  Zap,
  LogIn,
  Globe,
  Shield  // 新增：管理员图标
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../lib/store';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenLogin?: () => void;
  onOpenUserCenter?: () => void;
  onOpenRecharge?: () => void;
}

export function Sidebar({ 
  activeTab = 'video', 
  onTabChange,
  onOpenLogin,
  onOpenUserCenter,
  onOpenRecharge
}: SidebarProps) {
  const { user, isLoggedIn, credits, myVideos, myPrompts, savedProducts, myCharacters } = useStore();
  const [assetsExpanded, setAssetsExpanded] = useState(true);
  
  const navItems = [
    { id: 'video', icon: Video, label: 'AI 视频导演' },
    { id: 'square', icon: Globe, label: '内容广场' },
    // 管理员才能看到
    ...(user?.role === 'admin' ? [
      { id: 'admin', icon: Shield, label: '管理员控制台' }
    ] : [])
  ];

  const assetItems = [
    { id: 'my-videos', icon: Film, label: '我的视频', count: myVideos.length },
    { id: 'my-prompts', icon: MessageSquare, label: '我的提示词', count: myPrompts.length },
    { id: 'my-products', icon: Package, label: '我的商品', count: savedProducts.length },
    { id: 'my-characters', icon: Users, label: '我的角色', count: myCharacters.length },
  ];

  return (
    <div className="w-[240px] h-screen bg-white/60 backdrop-blur-xl border-r border-slate-200/60 flex flex-col shrink-0 relative z-20">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-slate-200/60 shrink-0 bg-white/40 backdrop-blur-md">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg blur opacity-20 animate-pulse"></div>
          <h1 className="relative font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">
            SoraDirector
          </h1>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-b border-slate-200/60">
        {isLoggedIn && user ? (
          <button
            onClick={onOpenUserCenter}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100/50 border border-transparent hover:border-slate-200/50 transition-all group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-[0_0_10px_rgba(251,191,36,0.2)] group-hover:scale-105 transition-transform">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate text-slate-800 group-hover:text-slate-900 transition-colors">{user.username}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="w-full flex items-center gap-3 p-3 bg-slate-100/50 hover:bg-slate-200/50 rounded-xl transition-all border border-slate-200/50 hover:border-slate-300/50"
          >
            <LogIn size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-600">登录/注册</span>
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto custom-scrollbar">
        {/* 主导航 */}
        <div className="space-y-2 mb-8">
          <div className="px-3 text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Workspace</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange?.(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all group relative overflow-hidden",
                  isActive 
                    ? "text-cyan-700 bg-cyan-50 border border-cyan-100" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                )}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-full" />}
                <Icon size={20} className={cn("shrink-0 transition-colors", isActive ? "text-cyan-600" : "text-slate-400 group-hover:text-slate-600")} />
                <span className="truncate font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* 我的资产 */}
        {isLoggedIn && (
          <div className="mt-2">
            <button
              onClick={() => setAssetsExpanded(!assetsExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider mb-2"
            >
              {assetsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>我的资产</span>
            </button>
            
            {assetsExpanded && (
              <div className="space-y-1 animate-in slide-in-from-left-5 duration-300">
                {assetItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange?.(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative group overflow-hidden",
                        isActive 
                          ? "text-cyan-700 bg-cyan-50 border border-cyan-100" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-full" />}
                      <Icon size={18} className={cn("shrink-0 transition-colors", isActive ? "text-cyan-600" : "text-slate-400 group-hover:text-slate-600")} />
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.count > 0 && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-xs font-bold transition-all",
                          isActive ? "bg-cyan-100/50 text-cyan-700" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        )}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Credits Display */}
      <div className="border-t border-slate-200/60 p-4 bg-white/40 backdrop-blur-md">
        <div className="glass p-4 rounded-xl border border-slate-200/60 relative overflow-hidden group bg-white/50">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-[30px] -mr-10 -mt-10 pointer-events-none group-hover:bg-yellow-500/20 transition-all duration-500" />
          
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Zap size={12} className="text-yellow-500" />
            可用积分
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1 drop-shadow-sm">{credits}</div>
          <div className="text-xs text-slate-400 mb-3">Credits</div>
          
          {isLoggedIn && (
            <button
              onClick={onOpenRecharge}
              className="w-full px-3 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-white rounded-lg flex items-center justify-center gap-2 transition-all text-sm font-bold shadow-md shadow-yellow-500/20 hover:shadow-yellow-500/30"
            >
              <Zap size={16} />
              立即充值
            </button>
          )}
        </div>
      </div>
    </div>
  );
}