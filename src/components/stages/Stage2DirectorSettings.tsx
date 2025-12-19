import React from 'react';
import { useFormStore } from '../../lib/store';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Globe, Monitor, Clock, Smartphone, Laptop } from 'lucide-react';

export function Stage2DirectorSettings() {
  const { directorSettings, updateDirectorSettings } = useFormStore();

  const languages = [
    { value: 'zh-CN' as const, label: '中文', flag: '🇨🇳', description: '适合中国大陆市场' },
    { value: 'en-US' as const, label: 'English', flag: '🇺🇸', description: '全球英语市场' },
    { value: 'id-ID' as const, label: 'Indonesia', flag: '🇮🇩', description: '印度尼西亚市场' },
    { value: 'vi-VN' as const, label: 'Tiếng Việt', flag: '🇻🇳', description: '越南市场' },
  ];

  const resolutions = [
    { 
      value: '720p' as const, 
      label: '720P', 
      description: '快速渲染，适合测试',
      icon: Monitor,
      specs: '1280×720',
    },
    { 
      value: '1080p' as const, 
      label: '1080P', 
      description: '高清成品，适合正式分发',
      icon: Monitor,
      specs: '1920×1080',
    },
  ];

  const durations = [
    { 
      value: 15 as const, 
      label: '15秒', 
      description: '黄金转化时段',
      subtitle: '适合快速种草',
    },
    { 
      value: 25 as const, 
      label: '25秒', 
      description: '深度展示时段',
      subtitle: '适合详细介绍',
    },
  ];

  const orientations = [
    {
      value: 'portrait' as const,
      label: '竖屏 (9:16)',
      description: '适合抖音、快手等短视频平台',
      icon: Smartphone,
    },
    {
      value: 'landscape' as const,
      label: '横屏 (16:9)',
      description: '适合B站、YouTube等平台',
      icon: Laptop,
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      {/* 大标题 */}
      <div className="text-center py-16 px-6">
        <h1 className="text-5xl font-bold mb-4">Configure your AI director</h1>
        <p className="text-gray-400 text-lg">Set language, resolution, duration and orientation</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-8">

        {/* 语言定位 */}
        <div className="bg-[#141414] rounded-2xl border border-gray-800 p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-yellow-400" />
              <Label className="text-xl font-semibold">Language</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => updateDirectorSettings({ language: lang.value })}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    directorSettings.language === lang.value
                      ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20'
                      : 'border-gray-800 hover:border-gray-700 bg-[#0a0a0a]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{lang.flag}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-lg">{lang.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{lang.description}</div>
                    </div>
                    {directorSettings.language === lang.value && (
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 分辨率、时长、方向 - 一行布局 */}
        <div className="grid grid-cols-3 gap-6">
          {/* 分辨率 */}
          <div className="bg-[#141414] rounded-2xl border border-gray-800 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-yellow-400" />
                <Label className="text-base font-semibold">Resolution</Label>
              </div>
              <div className="space-y-3">
                {resolutions.map((res) => (
                  <button
                    key={res.value}
                    onClick={() => updateDirectorSettings({ resolution: res.value })}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      directorSettings.resolution === res.value
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="font-bold text-white text-lg">{res.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{res.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 时长 */}
          <div className="bg-[#141414] rounded-2xl border border-gray-800 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <Label className="text-base font-semibold">Duration</Label>
              </div>
              <div className="space-y-3">
                {durations.map((dur) => (
                  <button
                    key={dur.value}
                    onClick={() => updateDirectorSettings({ duration: dur.value })}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      directorSettings.duration === dur.value
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="font-bold text-white text-lg">{dur.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{dur.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 视频方向 */}
          <div className="bg-[#141414] rounded-2xl border border-gray-800 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-yellow-400" />
                <Label className="text-base font-semibold">Orientation</Label>
              </div>
              <div className="space-y-3">
                {orientations.map((ori) => {
                  const Icon = ori.icon;
                  return (
                    <button
                      key={ori.value}
                      onClick={() => updateDirectorSettings({ orientation: ori.value })}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        directorSettings.orientation === ori.value
                          ? 'border-yellow-400 bg-yellow-400/10'
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="font-semibold text-white">{ori.label}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-center gap-4 pt-8">
          <Button
            variant="outline"
            onClick={() => useFormStore.getState().prevStage()}
            className="bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl px-8 h-12"
          >
            ← Back
          </Button>
          <Button
            size="lg"
            onClick={() => useFormStore.getState().nextStage()}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-xl px-12 h-12 shadow-lg shadow-yellow-400/30"
          >
            Continue to Scripting →
          </Button>
        </div>
      </div>
    </div>
  );
}
