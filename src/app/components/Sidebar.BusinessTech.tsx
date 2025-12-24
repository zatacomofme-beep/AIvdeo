import React, { useState } from 'react';
import { 
  Video, 
  Film,
  MessageSquare,
  Package,
  Users,
  Zap,
  LogIn,
  Globe,
  Shield,
  Grid3x3,
  ChevronRight,
  Command,
  CreditCard
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

export function SidebarBusinessTech({ 
  activeTab = 'video', 
  onTabChange,
  onOpenLogin,
  onOpenUserCenter,
  onOpenRecharge
}: SidebarProps) {
  const { user, isLoggedIn, credits, myVideos, myPrompts, savedProducts, myCharacters } = useStore();
  
  const navItems = [
    { id: 'video', icon: Video, label: '开始创作' },
    { id: 'nine-grid', icon: Grid3x3, label: '九宫格生成' },
    { id: 'square', icon: Globe, label: '内容广场' },
    ...(user?.role === 'admin' ? [
      { id: 'admin', icon: Shield, label: '管理员' }
    ] : [])
  ];

  const assetItems = [
    { id: 'my-videos', icon: Film, label: '我的视频', count: myVideos.length },
    { id: 'my-prompts', icon: MessageSquare, label: '提示词库', count: myPrompts.length },
    { id: 'my-products', icon: Package, label: '我的商品', count: savedProducts.length },
    { id: 'my-characters', icon: Users, label: '我的角色', count: myCharacters.length },
  ];

  return (
    <aside className="w-64 flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-md bg-tech flex items-center justify-center text-white shadow-tech-glow">
            <Command className="size-5" />
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">SEMOPIC</span>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-b border-slate-800/50">
        {isLoggedIn && user ? (
          <button
            onClick={onOpenUserCenter}
            className="w-full flex items-center gap-3 p-3 rounded-md bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-tech to-tech-hover rounded-md flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-tech-sm group-hover:shadow-tech-glow transition-all">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate text-white">{user.username}</div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
            </div>
            <ChevronRight className="size-4 text-slate-500 group-hover:text-slate-300" />
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-tech/50 rounded-md transition-all group"
          >
            <LogIn size={18} className="text-slate-400 group-hover:text-tech transition-colors" />
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">登录/注册</span>
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Workspace Section */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Workspace</span>
          </div>
          
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange?.(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-tech/10 text-tech relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-tech before:rounded-r-sm"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("size-[18px] transition-colors", isActive ? "text-tech" : "text-slate-500 group-hover:text-slate-300")} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="size-4 opacity-50" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assets Section */}
        {isLoggedIn && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assets</span>
            </div>
            
            <div className="space-y-1">
              {assetItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange?.(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-tech/10 text-tech relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-tech before:rounded-r-sm"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon className={cn("size-[17px] shrink-0 transition-colors", isActive ? "text-tech" : "text-slate-500 group-hover:text-slate-300")} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-bold transition-all shrink-0",
                        isActive ? "bg-tech/20 text-tech" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300"
                      )}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Credits Display */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-md p-4 relative overflow-hidden group hover:border-tech/50 transition-all">
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-tech/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-tech/10 transition-all" />
          
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={14} className="text-tech" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Credits</span>
            </div>
            
            <div className="text-2xl font-bold text-white mb-1 font-mono">{credits.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mb-3">Available Balance</div>
            
            {isLoggedIn && (
              <button
                onClick={onOpenRecharge}
                className="w-full btn-tech-ai text-xs py-2 flex items-center justify-center gap-2"
              >
                <CreditCard size={14} />
                <span>充值积分</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
