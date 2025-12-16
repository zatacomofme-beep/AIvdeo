import React from 'react';
import { LayoutGrid, Film, FolderOpen, Zap, Settings, User } from 'lucide-react';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

export function Sidebar() {
  const { activeTab, setActiveTab, credits } = useStore();

  const navItems = [
    { id: 'studio', label: '创作工坊', icon: LayoutGrid },
    { id: 'assets', label: '我的作品', icon: FolderOpen },
    { id: 'prompt-square', label: '提示词广场', icon: Film },
  ];

  return (
    <div className="w-[240px] h-screen bg-[#121214] border-r border-[#2A2A2E] flex flex-col justify-between shrink-0 z-20">
      
      {/* Top Section */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-[#2A2A2E]/50">
          <h1 className="text-xl font-bold tracking-tighter text-gradient-primary">
            SoraDirector
          </h1>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary border-l-2 border-primary" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 space-y-4">
        
        {/* Credits Card */}
        <div className="bg-[#1E1E22] rounded-xl p-4 border border-[#2A2A2E]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">点数 (Credits)</span>
            <Zap size={14} className="text-[#FFD700]" />
          </div>
          <div className="text-2xl font-bold text-white mb-3">
            {credits}
          </div>
          <Button 
            className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#6A5ACD] hover:opacity-90 transition-opacity h-8 text-xs font-semibold"
          >
            升级套餐
          </Button>
        </div>

        <Separator className="bg-[#2A2A2E]" />

        {/* User Profile */}
        <div 
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
            SD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">Studio Admin</p>
            <p className="text-xs text-muted-foreground truncate">pro@soradirector.com</p>
          </div>
          <Settings size={14} className="text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
