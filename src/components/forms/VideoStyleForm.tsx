import React from 'react';
import { useFormStore } from '../../lib/store';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { Monitor, Smartphone, Film, Coffee, Briefcase, Zap } from 'lucide-react';

export function VideoStyleForm() {
  const { videoStyle, updateVideoStyle } = useFormStore();

  const styleOptions = [
    { value: 'realistic', label: '真实风格', icon: Zap, desc: 'High fidelity' },
    { value: 'casual', label: '休闲风格', icon: Coffee, desc: 'Vlog & Daily' },
    { value: 'professional', label: '专业风格', icon: Briefcase, desc: 'Commercial' },
    { value: 'cinematic', label: '电影风格', icon: Film, desc: 'Movie look' },
  ] as const;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          第二步：定义风格
        </h2>
        <p className="text-muted-foreground text-sm">
          设定视频的视觉基调、画幅比例以及输出质量。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Main Style Selection */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">核心风格</Label>
            <div className="grid grid-cols-2 gap-3">
              {styleOptions.map((option) => {
                const isActive = videoStyle.styleType === option.value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateVideoStyle({ styleType: option.value as any })}
                    className={cn(
                      "relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-start gap-2 text-left group overflow-hidden",
                      isActive
                        ? "bg-primary/20 border-primary text-primary shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]"
                        : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "bg-white/5 group-hover:bg-white/10"
                    )}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-[10px] opacity-70">{option.desc}</div>
                    </div>
                    {/* Glow effect */}
                    {isActive && <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">风格微调提示词</Label>
            <Input
              value={videoStyle.customDescription}
              onChange={(e) => updateVideoStyle({ customDescription: e.target.value })}
              className="bg-white/5 border-white/10 text-foreground h-11 focus-visible:ring-primary/50"
              placeholder="例如：王家卫色彩风格, 赛博朋克霓虹灯效..."
            />
          </div>
        </div>

        {/* Right: Technical Settings */}
        <div className="space-y-6 flex flex-col justify-start">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6 backdrop-blur-sm">
            {/* Orientation */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">画幅比例</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateVideoStyle({ orientation: 'portrait' })}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-sm transition-all",
                    videoStyle.orientation === 'portrait'
                      ? "bg-white/10 border-white/20 text-foreground ring-1 ring-white/10"
                      : "bg-transparent border-transparent text-muted-foreground hover:bg-white/5"
                  )}
                >
                  <Smartphone className="size-5" />
                  <div className="text-left">
                    <div className="font-medium">9:16 竖屏</div>
                    <div className="text-[10px] opacity-50">抖音/TikTok/Reels</div>
                  </div>
                </button>
                <button
                  onClick={() => updateVideoStyle({ orientation: 'landscape' })}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-sm transition-all",
                    videoStyle.orientation === 'landscape'
                      ? "bg-white/10 border-white/20 text-foreground ring-1 ring-white/10"
                      : "bg-transparent border-transparent text-muted-foreground hover:bg-white/5"
                  )}
                >
                  <Monitor className="size-5" />
                  <div className="text-left">
                    <div className="font-medium">16:9 横屏</div>
                    <div className="text-[10px] opacity-50">Youtube/Bilibili</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">视频时长</Label>
              <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                {[10, 15, 20].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => updateVideoStyle({ duration: dur as any })}
                    className={cn(
                      "flex-1 py-1.5 text-xs text-center rounded-md transition-all",
                      videoStyle.duration === dur
                        ? "bg-white/10 text-foreground font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {dur}秒
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">渲染画质</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateVideoStyle({ quality: 'standard' })}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-xs transition-all text-center",
                    videoStyle.quality === 'standard'
                      ? "bg-white/10 border-white/20 text-foreground"
                      : "bg-transparent border-white/5 text-muted-foreground hover:bg-white/5"
                  )}
                >
                  标准画质 (720p)
                </button>
                <button
                  onClick={() => updateVideoStyle({ quality: 'high' })}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-xs transition-all text-center",
                    videoStyle.quality === 'high'
                      ? "bg-primary/20 border-primary/50 text-primary font-medium"
                      : "bg-transparent border-white/5 text-muted-foreground hover:bg-white/5"
                  )}
                >
                  高清画质 (1080p)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
