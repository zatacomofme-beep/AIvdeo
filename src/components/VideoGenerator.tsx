import React, { useState } from 'react';
import { useFormStore } from '../lib/store';
import { AppLayout, StepId } from './layout/AppLayout';
import { NewProductUploadForm } from './forms/NewProductUploadForm';
import { ScriptReviewForm } from './forms/ScriptReviewForm';
import { PromptPreview } from './PromptPreview';
import { Button } from './ui/button';
import { Wand2, CheckCircle2 } from 'lucide-react';

export function VideoGenerator() {
  const [activeStep, setActiveStep] = useState<StepId>('product');
  const { currentStep, isGenerating, assembledPrompt } = useFormStore();

  // 根据业务流程步骤展示内容
  const renderStepContent = () => {
    if (currentStep === 'upload') {
      return <NewProductUploadForm />;
    } else if (currentStep === 'script_generating') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-indigo-600">AI 正在分析并生成脚本...</p>
          <p className="text-xs text-gray-400">请稍候，预计 30-60 秒</p>
        </div>
      );
    } else if (currentStep === 'script_ready' || currentStep === 'video_generating' || currentStep === 'completed') {
      return <ScriptReviewForm />;
    }
    return null;
  };

  return (
    <AppLayout
      activeStep={activeStep}
      onStepChange={setActiveStep}
      previewPanel={
        <div className="flex flex-col h-full text-foreground">
          <div className="flex-1 min-h-0 p-6 overflow-hidden">
            <PromptPreview />
          </div>

          {/* 状态指示条 */}
          <div className="p-6 border-t border-gray-200 bg-white">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    currentStep === 'upload' ? 'bg-gray-300' :
                    currentStep === 'script_generating' ? 'bg-yellow-400 animate-pulse' :
                    'bg-green-500'
                  }`} />
                  <span className="text-xs text-gray-600">
                    {
                      currentStep === 'upload' ? '等待上传' :
                      currentStep === 'script_generating' ? '脚本生成中' :
                      currentStep === 'script_ready' ? '脚本已就绪' :
                      currentStep === 'video_generating' ? '视频生成中' :
                      '已完成'
                    }
                  </span>
                </div>
                {currentStep === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </div>
              
              {/* 进度条 */}
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{
                    width:
                      currentStep === 'upload' ? '0%' :
                      currentStep === 'script_generating' ? '33%' :
                      currentStep === 'script_ready' ? '66%' :
                      currentStep === 'video_generating' ? '90%' :
                      '100%'
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-center text-gray-500">
              {currentStep === 'completed' 
                ? '✅ 视频生成完成！' 
                : '消耗 15 积分 / 次 · 预计耗时 2-3 分钟'
              }
            </p>
          </div>
        </div>
      }
    >
      {renderStepContent()}
    </AppLayout>
  );
}
