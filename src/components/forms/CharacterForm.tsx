import React, { useEffect } from 'react';
import { useFormStore } from '../../lib/store';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { User2, Users, Globe2, Shirt } from 'lucide-react';

export function CharacterForm() {
    const { character, updateCharacter } = useFormStore();

    useEffect(() => {
        const desc = `${character.age} ${character.gender}, ${character.market} market, ${character.traits.join(', ')}, wearing ${character.clothing}`;
        updateCharacter({ description: desc });
    }, [character.age, character.gender, character.market, character.traits, character.clothing, updateCharacter]);

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    第五步：角色设定
                </h2>
                <p className="text-muted-foreground text-sm">
                    定义视频中的核心人物画像，包括年龄、性别及市场定位。
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Demographics */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6 backdrop-blur-sm">
                        <div className="space-y-4">
                            {/* Age */}
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">年龄段 (Age Group)</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['GenZ', 'Millennial', '30s', '40+'].map(age => (
                                        <button
                                            key={age}
                                            onClick={() => updateCharacter({ age: age as any })}
                                            className={cn(
                                                "py-2 px-1 rounded-lg border text-xs transition-all",
                                                character.age === age
                                                    ? "bg-primary/20 border-primary text-primary font-medium"
                                                    : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                                            )}
                                        >
                                            {age}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">性别 (Gender)</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { val: 'Female', icon: User2, label: '女性' },
                                        { val: 'Male', icon: User2, label: '男性' },
                                        { val: 'Neutral', icon: Users, label: '中性/群像' },
                                    ].map(opt => (
                                        <button
                                            key={opt.val}
                                            onClick={() => updateCharacter({ gender: opt.val as any })}
                                            className={cn(
                                                "flex items-center justify-center gap-2 py-2 rounded-lg border text-xs transition-all",
                                                character.gender === opt.val
                                                    ? "bg-primary/20 border-primary text-primary font-medium"
                                                    : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                                            )}
                                        >
                                            {/* <opt.icon className="size-3" /> */}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">目标市场 (Target Market)</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { val: 'China', label: '🇨🇳 中国大陆' },
                                { val: 'Indonesia', label: '🇮🇩 印度尼西亚' },
                                { val: 'Vietnam', label: '🇻🇳 越南' },
                                { val: 'Global', label: '🌏 全球通用' },
                            ].map(m => (
                                <button
                                    key={m.val}
                                    onClick={() => updateCharacter({ market: m.val as any })}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                        character.market === m.val
                                            ? "bg-white/10 border-white/20 text-foreground ring-1 ring-white/10"
                                            : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                                    )}
                                >
                                    <span className="text-sm font-medium">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Appearance & Clothing */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">外貌特征 (Traits)</Label>
                            <Input
                                value={character.traits.join(', ')}
                                onChange={(e) => updateCharacter({ traits: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                className="bg-white/5 border-white/10 text-foreground h-11 focus-visible:ring-primary/50"
                                placeholder="e.g. friendly smile, short hair, glasses..."
                            />
                            <p className="text-[10px] text-muted-foreground/60">使用英文逗号分隔关键词</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">服装风格 (Clothing)</Label>
                            <div className="flex gap-2">
                                <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-white/5 border border-white/10 shrink-0">
                                    <Shirt className="size-5 text-muted-foreground" />
                                </div>
                                <Input
                                    value={character.clothing}
                                    onChange={(e) => updateCharacter({ clothing: e.target.value })}
                                    className="bg-white/5 border-white/10 text-foreground h-11 focus-visible:ring-primary/50"
                                    placeholder="例如：White T-shirt and Jeans (休闲风)..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Summary */}
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <Label className="text-[10px] text-primary/80 mb-2 block">AI Character Prompt Preview</Label>
                        <p className="text-sm text-primary/90 font-mono leading-relaxed">
                            {character.description || "Complete the form to generate prompt..."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
