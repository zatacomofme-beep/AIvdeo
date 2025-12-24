
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
  Shield,  // 新增：管理员图标
  Grid3x3    // 新增：九宫格图标
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
  const [workspaceExpanded, setWorkspaceExpanded] = useState(true);
  
  const navItems = [
    { id: 'video', icon: Video, label: '开始创作' },
    { id: 'nine-grid', icon: Grid3x3, label: '九宫格生成' },
    { id: 'square', icon: Globe, label: '内容广场' },
    // 管理员才能看到
    ...(user?.role === 'admin' ? [
      { id: 'admin', icon: Shield, label: '管理员控制台' }
    ] : [])
  ];

  const assetItems = [
    { id: 'my-videos', icon: Film, label: '我的视频', count: myVideos.length },
    { id: 'my-prompts', icon: MessageSquare, label: '提示词库', count: myPrompts.length },
    { id: 'my-products', icon: Package, label: '我的商品', count: savedProducts.length },
    { id: 'my-characters', icon: Users, label: '我的角色', count: myCharacters.length },
  ];

  return (
    <div className="w-[260px] h-screen bg-gradient-to-b from-white/80 via-white/70 to-white/60 backdrop-blur-2xl border-r border-white/40 flex flex-col shrink-0 relative z-20 shadow-xl shadow-slate-200/50">
      {/* Logo with Gradient */}
      <div className="h-24 flex items-center justify-center px-6 border-b border-white/30 shrink-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <h1 className="relative font-black text-2xl tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent animate-gradient">
          SEMOPIC
        </h1>
      </div>

      {/* User Section with Modern Card */}
      <div className="p-4 border-b border-white/30">
        {isLoggedIn && user ? (
          <button
            onClick={onOpenUserCenter}
            className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-blue-50/80 border-2 border-transparent hover:border-purple-200/50 transition-all group relative overflow-hidden shadow-sm hover:shadow-md"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
            <div className="relative w-12 h-12 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg shadow-yellow-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="relative flex-1 min-w-0 text-left">
              <div className="text-sm font-bold truncate text-slate-900 group-hover:text-purple-700 transition-colors">{user.username}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-slate-100/80 to-slate-50/80 hover:from-purple-100/80 hover:to-blue-100/80 rounded-2xl transition-all border-2 border-slate-200/50 hover:border-purple-300/50 shadow-sm hover:shadow-md group"
          >
            <LogIn size={20} className="text-slate-500 group-hover:text-purple-600 transition-colors" />
            <span className="text-sm font-bold text-slate-600 group-hover:text-purple-700 transition-colors">登录/注册</span>
          </button>
        )}
      </div>

      {/* Main Navigation with Modern Style */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto custom-scrollbar">
        {/* 创作中心 */}
        <div className="mb-8">
          <button
            onClick={() => setWorkspaceExpanded(!workspaceExpanded)}
            className="w-full px-4 py-3.5 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 hover:from-purple-400 hover:via-blue-400 hover:to-cyan-400 text-white rounded-2xl flex items-center justify-center gap-2 transition-all text-sm font-black shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] mb-3 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <span className="relative">{workspaceExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
            <span className="relative">✨ 创作中心</span>
          </button>
          
          {workspaceExpanded && (
            <div className="space-y-2 animate-in slide-in-from-left-5 duration-300">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange?.(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all group relative overflow-hidden shadow-sm hover:shadow-md",
                      isActive 
                        ? "text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/30" 
                        : "text-slate-600 hover:text-slate-900 bg-white/50 hover:bg-white/80 border border-white/60 hover:border-purple-200/50"
                    )}
                  >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                    <Icon size={20} className={cn("relative shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-purple-600")} />
                    <span className="relative truncate font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 我的资产 */}
        {isLoggedIn && (
          <div className="mt-2">
            <button
              onClick={() => setAssetsExpanded(!assetsExpanded)}
              className="w-full px-4 py-3.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-300 hover:via-amber-400 hover:to-orange-400 text-white rounded-2xl flex items-center justify-center gap-2 transition-all text-sm font-black shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-[1.02] mb-3 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
              <span className="relative">{assetsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
              <span className="relative">💼 我的资产</span>
            </button>
            
            {assetsExpanded && (
              <div className="space-y-2 animate-in slide-in-from-left-5 duration-300">
                {assetItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange?.(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all relative group overflow-hidden shadow-sm hover:shadow-md",
                        isActive 
                          ? "text-white bg-gradient-to-r from-yellow-500 to-amber-500 shadow-yellow-500/30" 
                          : "text-slate-600 hover:text-slate-900 bg-white/50 hover:bg-white/80 border border-white/60 hover:border-yellow-200/50"
                      )}
                    >
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                      <Icon size={18} className={cn("relative shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-yellow-600")} />
                      <span className="relative truncate flex-1 text-left font-bold">{item.label}</span>
                      {item.count > 0 && (
                        <span className={cn(
                          "relative px-2.5 py-1 rounded-lg text-xs font-black transition-all shadow-sm",
                          isActive ? "bg-white/30 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-yellow-100 group-hover:text-yellow-700"
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

      {/* Credits Display with Modern Card */}
      <div className="border-t border-white/30 p-4 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 backdrop-blur-md">
        <div className="p-5 rounded-2xl border-2 border-white/60 relative overflow-hidden group bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-[40px] -mr-12 -mt-12 pointer-events-none group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
          
          <div className="relative">
            <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <Zap size={14} className="text-yellow-500" />
              可用积分
            </div>
            <div className="text-4xl font-black bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent mb-1 drop-shadow-sm">{credits}</div>
            <div className="text-xs font-semibold text-slate-400 mb-4">Credits</div>
            
            {isLoggedIn && (
              <button
                onClick={onOpenRecharge}
                className="w-full px-4 py-3 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-300 hover:via-amber-400 hover:to-orange-400 text-white rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-black shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-[1.02] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <Zap size={16} className="relative" />
                <span className="relative">⚡ 立即充值</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}