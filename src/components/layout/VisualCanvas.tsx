import React, { useCallback } from 'react';
import { useStore } from '../../lib/store';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Upload, X, Lock, Fingerprint, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';

export function VisualCanvas() {
  const { uploadedImage, setUploadedImage, character, script } = useStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [imageBase64, setImageBase64] = React.useState<string | null>(null);

  const handleFileProcess = async (file: File) => {
     if (!file.type.startsWith('image/')) return;
     
     setIsUploading(true);
     try {
       // 同时进行：1. 上传到TOS获取URL  2. 转换为base64
       const [url, base64] = await Promise.all([
         api.uploadImage(file),
         fileToBase64(file)
       ]);
       
       setUploadedImage(url);
       setImageBase64(base64);
       
       // 将base64存储到store供后续使用
       useStore.setState({ imageBase64: base64 });
       useStore.getState().setPipelineStage('image_uploaded');
     } catch (error) {
       console.error("Upload failed", error);
     } finally {
       setIsUploading(false);
     }
  };

  // 将文件转换为base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Mock upload trigger
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileProcess(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 bg-[#050505] flex flex-col relative overflow-hidden">
      
      {/* HUD Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-4 text-xs font-mono text-muted-foreground">
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          系统正常
        </span>
        <span className="text-[#2A2A2E]">|</span>
        <span>1920x1080 @ 60fps</span>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div 
          className="relative w-full max-w-4xl aspect-video bg-[#0A0A0C] border-2 border-dashed border-[#2A2A2E] rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all group"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {uploadedImage ? (
            <div className="relative w-full h-full">
              <img 
                src={uploadedImage} 
                alt="Product Anchor" 
                className="w-full h-full object-contain p-8" 
              />
              
              {/* HUD Overlays */}
              {character && (
                <div className="absolute inset-0 pointer-events-none">
                   {/* 左侧: 角色卡片 */}
                   <motion.div 
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="absolute top-8 left-8"
                   >
                     <div className="px-3 py-2 bg-cyan-900/30 border border-cyan-500/50 text-cyan-300 rounded text-xs backdrop-blur-md max-w-[200px]">
                       <div className="font-bold mb-1 flex items-center gap-1">
                         <Fingerprint size={10} />
                         角色卡片
                       </div>
                       <div className="space-y-0.5 text-[10px] opacity-90">
                         <div>🌍 {character.market || 'N/A'}</div>
                         <div>👤 {character.gender || 'N/A'} / {character.age || 'N/A'}</div>
                         <div>✨ {character.vibe || 'N/A'}</div>
                       </div>
                     </div>
                   </motion.div>
                </div>
              )}
              
              {/* Control Buttons - 独立层，确保可点击 */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                {/* Delete Button */}
                <button 
                  onClick={() => {
                    console.log('[Canvas] 删除图片');
                    setUploadedImage('');
                  }}
                  className="p-2 bg-black/70 text-white rounded-full hover:bg-red-500 hover:scale-110 transition-all shadow-lg"
                  title="删除图片"
                >
                  <X size={20} />
                </button>
                
                {/* Re-upload Button */}
                <button 
                  onClick={() => {
                    console.log('[Canvas] 重新上传');
                    fileInputRef.current?.click();
                  }}
                  className="p-2 bg-black/70 text-white rounded-full hover:bg-[#8A2BE2] hover:scale-110 transition-all shadow-lg"
                  title="重新上传"
                >
                  <Upload size={20} />
                </button>
              </div>
              
              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1E1E22] flex items-center justify-center mx-auto text-muted-foreground group-hover:text-[#8A2BE2] transition-colors relative">
                {isUploading ? (
                  <Loader2 className="animate-spin text-[#8A2BE2]" size={32} />
                ) : (
                  <Upload size={32} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">
                  {isUploading ? "正在上传..." : "上传产品锚点图"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isUploading ? "正在分析视觉特征..." : "拖拽图片到这里或点击浏览"}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="bg-transparent border-[#2A2A2E] hover:bg-[#2A2A2E] text-white"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                浏览文件
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Timeline - PRD 1.3 显示脚本分镜 */}
      <div className="h-20 bg-[#0A0A0C] border-t border-[#2A2A2E] px-4 py-2 overflow-hidden">
        {script && script.length > 0 ? (
          <div className="h-full">
            <div className="text-xs font-mono text-muted-foreground uppercase mb-2 flex items-center gap-2">
              <span>🎬 分镜时间轴</span>
              <span className="text-[10px] text-cyan-400">{script.length} 个镜头</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {script.map((item: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 px-3 py-1.5 bg-[#1E1E22] border border-[#2A2A2E] rounded text-xs hover:border-cyan-500/50 transition-colors cursor-pointer group"
                >
                  <div className="font-mono text-cyan-400 text-[10px] mb-0.5">{item.time}</div>
                  <div className="text-gray-300 max-w-[120px] truncate group-hover:text-white">{item.audio}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{item.emotion}</div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase">时间轴</span>
            <span className="text-xs text-zinc-600">脚本生成后将显示在这里</span>
          </div>
        )}
      </div>
    </div>
  );
}
