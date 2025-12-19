import React from 'react';
import { useFormStore } from '../../lib/store';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Plus, Trash2, Mic2, Music, Sparkles, Clock, Smile, Frown } from 'lucide-react';

export function ScriptForm() {
    const { script, updateScript, audio, overallFeeling, updateAudio, updateOverallFeeling } = useFormStore();

    const addShot = () => {
        updateScript({
            shots: [
                ...script.shots,
                { time: '', scene: '', action: '', audio: '', emotion: '' },
            ],
        });
    };

    const removeShot = (index: number) => {
        updateScript({
            shots: script.shots.filter((_, i) => i !== index),
        });
    };

    const updateShot = (index: number, field: string, value: string) => {
        const newShots = [...script.shots];
        newShots[index] = { ...newShots[index], [field]: value };
        updateScript({ shots: newShots });
    };

    return (
        <div className="space-y-12 animate-fade-in max-w-4xl mx-auto pb-20">

            {/* SECTION 1: EMOTIONAL ARC */}
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        第六步：脚本与情感
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        编排视频的情绪起伏，逐个镜头细化脚本内容。
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="flex-1 w-full space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">起始情绪 (Start)</Label>
                        <div className="relative">
                            <select
                                value={script.emotionArc.start}
                                onChange={(e) => updateScript({ emotionArc: { ...script.emotionArc, start: e.target.value as any } })}
                                className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-foreground text-sm appearance-none focus:ring-1 focus:ring-primary/50"
                            >
                                <option value="anxious">Anxious (焦虑/痛点)</option>
                                <option value="curious">Curious (好奇/探索)</option>
                                <option value="neutral">Neutral (平静/叙述)</option>
                            </select>
                            <Frown className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    <div className="hidden md:block h-px w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="flex-1 w-full space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">结束情绪 (End)</Label>
                        <div className="relative">
                            <select
                                value={script.emotionArc.end}
                                onChange={(e) => updateScript({ emotionArc: { ...script.emotionArc, end: e.target.value as any } })}
                                className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-foreground text-sm appearance-none focus:ring-1 focus:ring-primary/50"
                            >
                                <option value="satisfied">Satisfied (满意/解决)</option>
                                <option value="excited">Excited (兴奋/高潮)</option>
                                <option value="relieved">Relieved (释然/轻松)</option>
                            </select>
                            <Smile className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: SHOT LIST */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-6 rounded bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {script.shots.length}
                        </div>
                        <Label className="text-sm font-medium">分镜列表</Label>
                    </div>
                    <Button
                        onClick={addShot}
                        size="sm"
                        variant="outline"
                        className="h-8 border-dashed border-white/20 hover:border-primary hover:text-primary bg-transparent text-xs"
                    >
                        <Plus className="size-3.5 mr-1.5" />
                        添加分镜
                    </Button>
                </div>

                <div className="space-y-4">
                    {script.shots.map((shot, index) => (
                        <div key={index} className="group relative p-5 bg-card/10 hover:bg-card/20 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-300">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                {script.shots.length > 1 && (
                                    <button
                                        onClick={() => removeShot(index)}
                                        className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded-md hover:bg-white/5"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-xs font-mono text-primary/70 bg-primary/10 px-2 py-0.5 rounded">SHOT {index + 1}</span>
                                <div className="flex-1 h-px bg-white/5" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* Time & Emotion */}
                                <div className="md:col-span-3 space-y-3">
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                            <Clock className="size-3" /> 时间范围
                                        </Label>
                                        <Input
                                            value={shot.time}
                                            onChange={(e) => updateShot(index, 'time', e.target.value)}
                                            placeholder="0-3s"
                                            className="bg-black/20 border-white/5 h-8 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                            <Smile className="size-3" /> 镜头情绪
                                        </Label>
                                        <Input
                                            value={shot.emotion}
                                            onChange={(e) => updateShot(index, 'emotion', e.target.value)}
                                            placeholder="Happy"
                                            className="bg-black/20 border-white/5 h-8 text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="md:col-span-9 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-[10px] text-muted-foreground mb-1.5">场景描述 (Visual)</Label>
                                            <Input
                                                value={shot.scene}
                                                onChange={(e) => updateShot(index, 'scene', e.target.value)}
                                                placeholder="描述画面内容..."
                                                className="bg-black/20 border-white/5 h-8 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] text-muted-foreground mb-1.5">人物动作 (Action)</Label>
                                            <Input
                                                value={shot.action}
                                                onChange={(e) => updateShot(index, 'action', e.target.value)}
                                                placeholder="人物在做什么..."
                                                className="bg-black/20 border-white/5 h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                            <Mic2 className="size-3" /> 台词/旁白 (Audio)
                                        </Label>
                                        <Input
                                            value={shot.audio}
                                            onChange={(e) => updateShot(index, 'audio', e.target.value)}
                                            placeholder="输入该镜头的配音文案..."
                                            className="bg-black/20 border-white/5 h-8 text-xs text-foreground/90"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECTION 3: AUDIO & VIBE (Combined for better flow) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Music className="size-4 text-primary" />
                        <span className="text-sm font-medium">背景配乐</span>
                    </div>
                    <div className="space-y-3">
                        <select
                            value={audio.backgroundMusic}
                            onChange={(e) => updateAudio({ backgroundMusic: e.target.value as any })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                        >
                            <option value="none">无音乐 (Silent)</option>
                            <option value="subtle">轻柔背景乐 (Subtle)</option>
                            <option value="upbeat">欢快节奏 (Upbeat)</option>
                        </select>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] text-muted-foreground">环境音效 (Ambience)</Label>
                            <Input
                                value={audio.ambientSound}
                                onChange={(e) => updateAudio({ ambientSound: e.target.value })}
                                className="bg-white/5 border-white/10 h-9 text-xs"
                                placeholder="e.g. office chatters, birds..."
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="size-4 text-primary" />
                        <span className="text-sm font-medium">最终基调验证</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] text-muted-foreground">核心氛围 (Vibe Keywords)</Label>
                            <Input
                                value={overallFeeling.vibe.join(', ')}
                                onChange={(e) => updateOverallFeeling({ vibe: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                className="bg-white/5 border-white/10 h-9 text-xs"
                                placeholder="Inspiring, Authentic, High-energy..."
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] text-muted-foreground">最终目标 (Goal)</Label>
                            <Input
                                value={overallFeeling.goal}
                                onChange={(e) => updateOverallFeeling({ goal: e.target.value })}
                                className="bg-white/5 border-white/10 h-9 text-xs"
                                placeholder="e.g. Sell the product, Build trust..."
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
