import React, { useEffect } from 'react';
import { useFormStore } from '../../lib/store';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { Play, Pause, Download, Film, AlertCircle, CheckCircle2, Clock, Hash } from 'lucide-react';

export function Stage4RenderingDelivery() {
  const { rendering, startRendering, cancelRendering, pollRenderingStatus } = useFormStore();

  // 开始渲染
  const handleStartRendering = async () => {
    await startRendering();
  };

  // 轮询状态
  useEffect(() => {
    if (rendering.status === 'rendering' && rendering.taskId) {
      const interval = setInterval(() => {
        pollRenderingStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [rendering.status, rendering.taskId]);

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      {/* 大标题 */}
      <div className="text-center py-16 px-6">
        <h1 className="text-5xl font-bold mb-4">Render & Deliver</h1>
        <p className="text-gray-400 text-lg">GPU rendering with real-time progress tracking</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-8">

        {/* 状态卡片 */}
        <div className="bg-[#141414] rounded-2xl border border-gray-800 p-8">
          <div className="space-y-6">
            {/* 状态头部 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {rendering.status === 'idle' && (
                  <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                )}
                {rendering.status === 'rendering' && (
                  <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
                )}
                {rendering.status === 'completed' && (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                )}
                {rendering.status === 'failed' && (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                )}
                
                <div>
                  <Label className="text-2xl font-bold text-white">
                    {rendering.status === 'idle' && 'Ready to start'}
                    {rendering.status === 'rendering' && 'GPU Rendering...'}
                    {rendering.status === 'completed' && 'Rendering Complete'}
                    {rendering.status === 'failed' && 'Rendering Failed'}
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    {rendering.status === 'idle' && 'Click below to start video generation'}
                    {rendering.status === 'rendering' && 'Please wait while we process your video'}
                    {rendering.status === 'completed' && 'Your video is ready'}
                    {rendering.status === 'failed' && 'An error occurred during rendering'}
                  </p>
                </div>
              </div>

              {rendering.status === 'rendering' && (
                <Button variant="outline" size="sm" onClick={cancelRendering} className="bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800">
                  Cancel
                </Button>
              )}
            </div>

            {/* 进度条 */}
            {rendering.status === 'rendering' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Rendering Progress</span>
                  <span className="font-bold text-yellow-400 text-lg">{rendering.progress}%</span>
                </div>
                <div className="h-3 bg-[#0a0a0a] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500 rounded-full"
                    style={{ width: `${rendering.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 任务信息 */}
            {rendering.taskId && (
              <div className="grid grid-cols-2 gap-4 p-5 bg-[#0a0a0a] rounded-xl border border-gray-800">
                <div className="flex items-center gap-3">
                  <Hash className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label className="text-xs text-gray-500">Task ID</Label>
                    <p className="text-sm font-mono text-white truncate">{rendering.taskId}</p>
                  </div>
                </div>
                {rendering.estimatedTime > 0 && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <Label className="text-xs text-gray-500">Estimated Time</Label>
                      <p className="text-sm font-medium text-white">
                        {Math.ceil(rendering.estimatedTime / 60)} min
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            {rendering.status === 'idle' && (
              <Button
                onClick={handleStartRendering}
                size="lg"
                className="w-full h-16 text-lg font-bold shadow-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl"
              >
                <Film className="w-6 h-6 mr-2" />
                Animate for Free
              </Button>
            )}

            {rendering.status === 'failed' && (
              <Button
                onClick={handleStartRendering}
                size="lg"
                className="w-full bg-transparent border-2 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl h-14"
                variant="outline"
              >
                Retry
              </Button>
            )}
          </div>
        </div>

        {/* 视频预览区域 */}
        {rendering.status === 'completed' && rendering.videoUrl && (
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/30 p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                <Label className="text-2xl font-bold text-green-400">Generation Successful!</Label>
              </div>

              {/* 手机模型容器 */}
              <div className="flex justify-center">
                <PhonePreview videoUrl={rendering.videoUrl} />
              </div>

              {/* 下载按钮 */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => window.open(rendering.videoUrl!, '_blank')}
                  className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white rounded-xl px-6 h-12"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play in New Tab
                </Button>
                <Button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = rendering.videoUrl!;
                    a.download = 'video.mp4';
                    a.click();
                  }}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl px-8 h-12 font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Video
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 渲染进度详情 */}
        {rendering.status === 'rendering' && (
          <div className="bg-[#141414] rounded-2xl border border-gray-800 p-8">
            <div className="space-y-6">
              <Label className="text-lg font-semibold text-white">Rendering Pipeline</Label>
              
              <div className="space-y-4">
                <RenderingStep
                  label="Initializing render environment"
                  isActive={rendering.progress >= 0}
                  isCompleted={rendering.progress > 20}
                />
                <RenderingStep
                  label="Loading assets and resources"
                  isActive={rendering.progress >= 20}
                  isCompleted={rendering.progress > 40}
                />
                <RenderingStep
                  label="Compositing video frames"
                  isActive={rendering.progress >= 40}
                  isCompleted={rendering.progress > 70}
                />
                <RenderingStep
                  label="Audio mixing & processing"
                  isActive={rendering.progress >= 70}
                  isCompleted={rendering.progress > 90}
                />
                <RenderingStep
                  label="Encoding & export"
                  isActive={rendering.progress >= 90}
                  isCompleted={rendering.progress === 100}
                />
              </div>
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="flex justify-center gap-4 pt-8">
          <Button
            variant="outline"
            onClick={() => useFormStore.getState().prevStage()}
            disabled={rendering.status === 'rendering'}
            className="bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl px-8 h-12"
          >
            ← Back
          </Button>
          
          {rendering.status === 'completed' && (
            <Button
              size="lg"
              onClick={() => {
                useFormStore.getState().goToStage(1);
                useFormStore.getState().cancelRendering();
              }}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-xl px-12 h-12 shadow-lg shadow-yellow-400/30"
            >
              Create New Video
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// 手机预览组件 (9:16)
function PhonePreview({ videoUrl }: { videoUrl: string }) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative">
      {/* 手机外壳 */}
      <div className="relative w-80 bg-black rounded-[3rem] p-3 shadow-2xl shadow-black/50">
        {/* 刷海 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
        
        {/* 屏幕区域 (9:16比例) */}
        <div className="relative bg-gray-900 rounded-[2.5rem] overflow-hidden" style={{ aspectRatio: '9/16' }}>
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            onClick={togglePlay}
          />
          
          {/* 播放控制覆盖层 */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={togglePlay}
            >
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-500 transition-colors shadow-xl">
                <Play className="w-10 h-10 text-black ml-1" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 提示文字 */}
      <p className="text-center text-sm text-gray-500 mt-4">
        9:16 Mobile Preview
      </p>
    </div>
  );
}

// 渲染步骤组件
function RenderingStep({
  label,
  isActive,
  isCompleted,
}: {
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        isCompleted
          ? 'bg-green-500'
          : isActive
          ? 'bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50'
          : 'bg-gray-800'
      }`}>
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-white" />
        ) : (
          <div className="w-2 h-2 bg-white rounded-full"></div>
        )}
      </div>
      <span className={`text-sm font-medium ${
        isCompleted
          ? 'text-green-400'
          : isActive
          ? 'text-yellow-400'
          : 'text-gray-600'
      }`}>
        {label}
      </span>
    </div>
  );
}
