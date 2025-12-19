import { useFormStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Film, Play, Clock, MessageSquare, Heart, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScriptReviewForm() {
  const { script, productInfo, generateVideoFromScript, isGenerating, currentStep } = useFormStore();

  if (!script.isGenerated) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Film className="w-12 h-12 mb-3 text-gray-300" />
        <p className="text-sm">脚本尚未生成</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 标题区域 */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
          <Film className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">视频脚本预览</h2>
      </div>

      {/* 脚本镜头列表 */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3 pr-4">
          {script.shots.map((shot, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-3 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              {/* 镜头编号和时间 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {shot.time}
                  </div>
                </div>
                
                {/* 对应的图片索引 */}
                {shot.imageIndex !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    <ImageIcon className="w-3 h-3" />
                    图片 {shot.imageIndex + 1}
                  </div>
                )}
              </div>

              {/* 场景描述 */}
              {shot.scene && (
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">场景</div>
                  <div className="text-sm text-gray-700">{shot.scene}</div>
                </div>
              )}

              {/* 动作描述 */}
              {shot.action && (
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">动作</div>
                  <div className="text-sm text-gray-700">{shot.action}</div>
                </div>
              )}

              {/* 台词 */}
              {shot.audio && (
                <div className="mb-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <MessageSquare className="w-3 h-3" />
                    台词
                  </div>
                  <div className="text-sm text-gray-900 font-medium bg-gray-50 rounded px-2 py-1">
                    "{shot.audio}"
                  </div>
                </div>
              )}

              {/* 情绪 */}
              {shot.emotion && (
                <div className="flex items-center gap-1 text-xs text-pink-600">
                  <Heart className="w-3 h-3" />
                  {shot.emotion}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* 情绪弧线 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
        <div className="text-xs text-gray-600 mb-1">情绪弧线</div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-indigo-600 font-medium">
            {script.emotionArc.start === 'anxious' && '焦虑'}
            {script.emotionArc.start === 'curious' && '好奇'}
            {script.emotionArc.start === 'neutral' && '中性'}
          </span>
          <span className="text-gray-400">→</span>
          <span className="text-purple-600 font-medium">
            {script.emotionArc.end === 'satisfied' && '满意'}
            {script.emotionArc.end === 'excited' && '兴奋'}
            {script.emotionArc.end === 'relieved' && '释然'}
          </span>
        </div>
      </div>

      {/* 商品图片预览 */}
      <div>
        <div className="text-xs text-gray-600 mb-2">商品素材（{productInfo.productImages.length}张）</div>
        <div className="grid grid-cols-5 gap-1">
          {productInfo.productImages.map((url, index) => (
            <div key={index} className="relative aspect-square rounded overflow-hidden border border-gray-200">
              <img src={url} alt={`商品${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 生成视频按钮 */}
      <Button
        onClick={generateVideoFromScript}
        disabled={isGenerating || currentStep === 'video_generating' || currentStep === 'completed'}
        className={cn(
          "w-full h-10 font-medium transition-all",
          currentStep === 'completed'
            ? "bg-green-600 hover:bg-green-700"
            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        )}
      >
        {currentStep === 'video_generating' ? (
          <>
            <Play className="w-4 h-4 mr-2 animate-pulse" />
            视频生成中...
          </>
        ) : currentStep === 'completed' ? (
          <>
            ✓ 视频已生成
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            生成视频
          </>
        )}
      </Button>

      {/* 提示信息 */}
      {currentStep === 'script_ready' && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <p>💡 脚本已自动生成，点击「生成视频」开始制作</p>
        </div>
      )}
    </div>
  );
}
