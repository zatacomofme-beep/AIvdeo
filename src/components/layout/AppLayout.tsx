import React from 'react';
import { cn } from '../../lib/utils';
import {
    Box,
    Palette,
    Clapperboard,
    Camera,
    Users,
    ScrollText,
    Sparkles,
    Settings,
    LogOut
} from 'lucide-react';
import { Button } from '../ui/button';

export type StepId = 'product' | 'style' | 'scene' | 'camera' | 'character' | 'script';

interface AppLayoutProps {
    children: React.ReactNode;
    previewPanel: React.ReactNode;
    activeStep: StepId;
    onStepChange: (step: StepId) => void;
}

const NAVIGATION_ITEMS: { id: StepId; label: string; icon: React.ElementType }[] = [
    { id: 'product', label: '产品信息', icon: Box },
    { id: 'style', label: '视觉风格', icon: Palette },
    { id: 'scene', label: '场景搭建', icon: Clapperboard },
    { id: 'camera', label: '镜头语言', icon: Camera },
    { id: 'character', label: '角色设定', icon: Users },
    { id: 'script', label: '脚本创作', icon: ScrollText },
];

export function AppLayout({ children, previewPanel, activeStep, onStepChange }: AppLayoutProps) {
    return (
        <div className="flex h-screen w-full bg-white text-foreground overflow-hidden selection:bg-[#6366f1]/30 font-sans">
            {/* 1. 左侧导航栏 */}
            <aside className="w-[260px] flex flex-col border-r border-gray-200 bg-gray-50 relative z-20">
                {/* 品牌头部 */}
                <div className="h-[68px] flex items-center px-6">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-[#6366f1] flex items-center justify-center shadow-lg shadow-[#6366f1]/20">
                            <Sparkles className="size-4 text-white" />
                        </div>
                        <span className="text-[15px] font-bold tracking-tight text-white">MindVideo</span>
                    </div>
                </div>

                {/* 导航菜单 */}
                <nav className="flex-1 py-6 px-4 space-y-1">
                    <div className="px-3 mb-3">
                        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">AI 视频</span>
                    </div>
                    {NAVIGATION_ITEMS.map((item) => {
                        const isActive = activeStep === item.id;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onStepChange(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                                )}
                            >
                                <Icon className={cn("size-[18px] transition-colors", isActive ? "text-[#6366f1]" : "text-gray-400 group-hover:text-gray-600")} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* 底部用户区 */}
                <div className="p-4 border-t border-gray-200">
                    <Button
                        size="lg"
                        className="w-full bg-[#6366f1] hover:bg-[#5558dd] text-white font-medium h-10 rounded-lg shadow-lg shadow-[#6366f1]/20 transition-all active:scale-95"
                    >
                        登录
                    </Button>
                </div>
            </aside>

            {/* 2. 中间画布 */}
            <main className="flex-1 relative flex flex-col min-w-0 bg-white">
                {/* 背景光效: 顶部紫色微光 */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#6366f1]/3 via-[#6366f1]/[0.01] to-transparent pointer-events-none" />

                {/* 装饰: 右上角光晕 */}
                <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 relative z-10">
                    <div className="max-w-[900px] mx-auto animate-fade-in pb-12">
                        {children}
                    </div>
                </div>
            </main>

            {/* 3. 右侧检查器 */}
            <aside className="w-[440px] flex flex-col border-l border-gray-200 bg-gray-50 relative z-10">
                {previewPanel}
            </aside>
        </div>
    );
}
