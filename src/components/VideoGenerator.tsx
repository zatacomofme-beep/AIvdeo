import React from 'react';
import { useFormStore } from '../lib/store';
import { Stage1ProductModeling } from './stages/Stage1ProductModeling';
import { Stage2DirectorSettings } from './stages/Stage2DirectorSettings';
import { Stage3ScriptingEngine } from './stages/Stage3ScriptingEngine';
import { Stage4RenderingDelivery } from './stages/Stage4RenderingDelivery';
import { Card } from './ui/card';
import { CheckCircle2, Home, Image, Settings, Video, Wand2 } from 'lucide-react';

export function VideoGenerator() {
  const { currentStage, productInfo, directorSettings, script, rendering } = useFormStore();

  // 根据当前阶段渲染对应组件
  const renderStageContent = () => {
    switch (currentStage) {
      case 1:
        return <Stage1ProductModeling />;
      case 2:
        return <Stage2DirectorSettings />;
      case 3:
        return <Stage3ScriptingEngine />;
      case 4:
        return <Stage4RenderingDelivery />;
      default:
        return <Stage1ProductModeling />;
    }
  };

  // 判断阶段是否完成
  const isStageCompleted = (stage: 1 | 2 | 3 | 4) => {
    switch (stage) {
      case 1:
        return (
          productInfo.productImages.length === 5 &&
          productInfo.productName &&
          productInfo.usageMethod &&
          productInfo.sellingPoints.length > 0
        );
      case 2:
        return true; // 导演配置有默认值，总是完成
      case 3:
        return script.isGenerated && script.shots.length > 0;
      case 4:
        return rendering.status === 'completed';
      default:
        return false;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* 左侧：简洁导航栏 */}
      <div className="w-20 bg-[#141414] border-r border-gray-800 flex flex-col items-center py-6 space-y-6">
        {/* Logo */}
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center">
          <Wand2 className="w-6 h-6 text-black" />
        </div>

        <div className="flex-1 flex flex-col items-center space-y-4 pt-8">
          <NavIconItem
            icon={Home}
            isActive={currentStage === 1}
            onClick={() => useFormStore.getState().goToStage(1)}
            tooltip="商品建模"
          />
          <NavIconItem
            icon={Settings}
            isActive={currentStage === 2}
            onClick={() => useFormStore.getState().goToStage(2)}
            tooltip="导演配置"
            disabled={!isStageCompleted(1)}
          />
          <NavIconItem
            icon={Image}
            isActive={currentStage === 3}
            onClick={() => useFormStore.getState().goToStage(3)}
            tooltip="脚本创作"
            disabled={!isStageCompleted(1)}
          />
          <NavIconItem
            icon={Video}
            isActive={currentStage === 4}
            onClick={() => useFormStore.getState().goToStage(4)}
            tooltip="生成交付"
            disabled={!isStageCompleted(3)}
          />
        </div>

        {/* 进度指示 */}
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
          <span className="text-xs font-bold text-yellow-400">{currentStage}/4</span>
        </div>
      </div>

      {/* 右侧：主内容区 */}
      <div className="flex-1 overflow-hidden">
        {renderStageContent()}
      </div>
    </div>
  );
}

// 导航图标组件
function NavIconItem({
  icon: Icon,
  isActive,
  onClick,
  disabled = false,
  tooltip,
}: {
  icon: any;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
        isActive
          ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/50'
          : disabled
          ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
