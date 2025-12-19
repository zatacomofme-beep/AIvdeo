import React from 'react';
import { useFormStore } from '../../lib/store';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { cn } from '../../lib/utils';
import { Building2, Home, Trees, Clapperboard, Sun, Moon, Maximize, Minimize } from 'lucide-react';

export function SceneForm() {
    const { scene, updateScene } = useFormStore();

    const sceneTypes = [
        { value: 'office', label: '办公室', icon: Building2, desc: 'Professional' },
        { value: 'home', label: '家居', icon: Home, desc: 'Cozy' },
        { value: 'outdoor', label: '户外', icon: Trees, desc: 'Natural' },
        { value: 'studio', label: '摄影棚', icon: Clapperboard, desc: 'Clean' },
    ] as const;

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    第三步：场景构建
                </h2>
                <p className="text-muted-foreground text-sm">
                    选择拍摄环境，设定光影氛围和空间质感。
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Scene Type Selection */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">场景类型</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {sceneTypes.map((type) => {
                                const isActive = scene.sceneType === type.value;
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        onClick={() => updateScene({ sceneType: type.value as any })}
                                        className={cn(
                                            "relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-start gap-3 group overflow-hidden",
                                            isActive
                                                ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_-5px_rgba(139,92,246,0.3)]"
                                                : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                                        )}
                                    >
                                        <Icon className={cn("size-6 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                        <div className="text-left">
                                            <div className="font-semibold text-sm">{type.label}</div>
                                            <div className="text-[10px] opacity-60">{type.desc}</div>
                                        </div>
                                        {isActive && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">场景细节描述</Label>
                        <Textarea
                            value={scene.description}
                            onChange={(e) => updateScene({ description: e.target.value })}
                            className="bg-white/5 border-white/10 text-foreground min-h-[120px] resize-none focus-visible:ring-primary/50 placeholder:text-muted-foreground/50"
                            placeholder="例如：极简主义风格的现代办公室，落地窗，阳光充足，白色极简家具..."
                        />
                    </div>
                </div>

                {/* Right: Ambience Settings */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Sun className="size-4 text-primary" />
                            <span className="text-sm font-medium">氛围与光影</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">光线照明</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'natural', label: '自然光', icon: Sun },
                                        { id: 'bright', label: '明亮通透', icon: Maximize }, // Metaphorical icon
                                        { id: 'dim', label: '氛围昏暗', icon: Moon },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => updateScene({ ambience: { ...scene.ambience, lighting: opt.id as any } })}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded-lg border text-xs transition-all",
                                                scene.ambience.lighting === opt.id
                                                    ? "bg-white/10 border-white/20 text-foreground"
                                                    : "bg-transparent border-transparent text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            <opt.icon className="size-4" />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">空间感</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'small', label: '紧凑特写' },
                                        { id: 'medium', label: '标准空间' },
                                        { id: 'spacious', label: '宽敞开阔' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => updateScene({ ambience: { ...scene.ambience, space: opt.id as any } })}
                                            className={cn(
                                                "py-2 px-2 rounded-lg border text-xs transition-all",
                                                scene.ambience.space === opt.id
                                                    ? "bg-white/10 border-white/20 text-foreground"
                                                    : "bg-transparent border-white/5 text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
