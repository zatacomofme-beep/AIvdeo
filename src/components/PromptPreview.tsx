import React from 'react';
import { useFormStore } from '../lib/store';
import { Copy, Check, Download, Terminal, Sparkles, Image as ImageIcon, Film } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';

export function PromptPreview() {
  const { productInfo, assembledPrompt, isGenerating, generatedVideoUrl, currentStep } = useFormStore();
  const [copied, setCopied] = React.useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(assembledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-fade-in">

      {/* 1. 商品图片预览卡片（5张网格） */}
      <div className={cn(
        "transition-all duration-500",
        productInfo.productImages && productInfo.productImages.length > 0 
          ? "block" 
          : "h-0 opacity-0 overflow-hidden"
      )}>
        {productInfo.productImages && productInfo.productImages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <ImageIcon className="w-3 h-3" />
              <span>商品素材 ({productInfo.productImages.length}/5)</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {productInfo.productImages.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <img
                    src={url}
                    alt={`商品${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Prompt 终端 */}
      <div className="flex-1 flex flex-col min-h-0 rounded-xl bg-white border border-gray-200 shadow-sm relative overflow-hidden">
        {/* 终端头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-mono font-medium text-gray-600 tracking-wider">PROMPT_PREVIEW.sh</span>
          </div>

          {assembledPrompt && (
            <button
              onClick={copyPrompt}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors text-xs text-gray-600 hover:text-gray-900"
            >
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>

        {/* 终端主体 */}
        <ScrollArea className="flex-1 p-4 font-mono text-xs leading-relaxed bg-gray-50">
          {assembledPrompt ? (
            <div className="space-y-4">
              <p className="text-green-700 whitespace-pre-wrap selection:bg-green-100 selection:text-green-800">
                <span className="opacity-50 select-none">$ </span>
                {assembledPrompt}
              </p>
              <div className="h-4 w-2 bg-green-500 animate-pulse" />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 select-none">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-center max-w-[200px] text-sm">
                开始配置你的视频，就能看到魔法发生...
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 3. 生成的视频 */}
      {generatedVideoUrl && (
        <div className="rounded-xl border border-green-200 bg-white overflow-hidden shadow-md animate-slide-up">
          <div className="px-4 py-3 border-b border-gray-200 bg-green-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-900">生成的视频</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-100"
              onClick={() => window.open(generatedVideoUrl)}
            >
              <Download className="w-3 h-3" />
              下载
            </Button>
          </div>
          <div className="aspect-video bg-black relative">
            <video
              src={generatedVideoUrl}
              controls
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
