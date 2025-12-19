import React, { useEffect } from 'react';
import { useFormStore } from '../../lib/store';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { Video, Move, Focus, Layers } from 'lucide-react';

export function CameraForm() {
    const { camera, updateCamera } = useFormStore();

    useEffect(() => {
        const desc = `${camera.shotType} shot, ${camera.framing} framing, ${camera.movement} movement, ${camera.depthOfField} depth of field`;
        updateCamera({ description: desc });
    }, [camera.shotType, camera.framing, camera.movement, camera.depthOfField, updateCamera]);

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    第四步：运镜设计
                </h2>
                <p className="text-muted-foreground text-sm">
                    导演级镜头控制，定义视点、甚至景深。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shot Type */}
                <div className="p-5 rounded-xl border border-white/5 bg-card/20 backdrop-blur-sm space-y-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-foreground/80">
                        <Video className="size-4 text-primary" />
                        <Label>拍摄角度 (Angle)</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { val: 'eye-level', label: '水平视角 (Normal)' },
                            { val: 'low-angle', label: '仰视 (Heroic)' },
                            { val: 'high-angle', label: '俯视 (Weak)' },
                            { val: 'bird-view', label: '上帝视角 (Map)' },
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => updateCamera({ shotType: opt.val as any })}
                                className={cn(
                                    "px-3 py-2 text-xs rounded-lg border text-left transition-all",
                                    camera.shotType === opt.val
                                        ? "bg-primary/20 border-primary/50 text-foreground shadow-sm"
                                        : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Framing */}
                <div className="p-5 rounded-xl border border-white/5 bg-card/20 backdrop-blur-sm space-y-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-foreground/80">
                        <Layers className="size-4 text-primary" />
                        <Label>景别 (Framing)</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { val: 'close-up', label: '特写 (Detail)' },
                            { val: 'medium-close', label: '近景 (Portrait)' },
                            { val: 'medium', label: '中景 (Waist)' },
                            { val: 'wide', label: '全景 (Full)' },
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => updateCamera({ framing: opt.val as any })}
                                className={cn(
                                    "px-3 py-2 text-xs rounded-lg border text-left transition-all",
                                    camera.framing === opt.val
                                        ? "bg-primary/20 border-primary/50 text-foreground shadow-sm"
                                        : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Movement */}
                <div className="p-5 rounded-xl border border-white/5 bg-card/20 backdrop-blur-sm space-y-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-foreground/80">
                        <Move className="size-4 text-primary" />
                        <Label>运镜方式 (Movement)</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { val: 'static', label: '固定镜头 (Static)' },
                            { val: 'pan', label: '摇镜头 (Pan)' },
                            { val: 'dolly-zoom', label: '希区柯克 (Dolly)' },
                            { val: 'handheld', label: '手持跟拍 (Shake)' },
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => updateCamera({ movement: opt.val as any })}
                                className={cn(
                                    "px-3 py-2 text-xs rounded-lg border text-left transition-all",
                                    camera.movement === opt.val
                                        ? "bg-primary/20 border-primary/50 text-foreground shadow-sm"
                                        : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DOF */}
                <div className="p-5 rounded-xl border border-white/5 bg-card/20 backdrop-blur-sm space-y-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-foreground/80">
                        <Focus className="size-4 text-primary" />
                        <Label>景深 (Depth)</Label>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { val: 'shallow', label: '浅景深 (虚化背景)' },
                            { val: 'normal', label: '标准 (人眼观感)' },
                            { val: 'deep', label: '深景深 (全清晰)' },
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => updateCamera({ depthOfField: opt.val as any })}
                                className={cn(
                                    "px-3 py-2 text-xs rounded-lg border text-left transition-all flex justify-between",
                                    camera.depthOfField === opt.val
                                        ? "bg-primary/20 border-primary/50 text-foreground shadow-sm"
                                        : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                                )}
                            >
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Generated Camera Prompt</span>
                <code className="text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded">
                    {camera.description}
                </code>
            </div>
        </div>
    );
}
