import React, { useCallback } from 'react';
import { useStore } from '../../lib/store';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Upload, X, Lock, Fingerprint, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';

export function VisualCanvas() {
  const { uploadedImage, setUploadedImage, productScale } = useStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileProcess = async (file: File) => {
     if (!file.type.startsWith('image/')) return;
     
     setIsUploading(true);
     try {
       // Upload to custom backend
       const url = await api.uploadImage(file);
       setUploadedImage(url);
     } catch (error) {
       console.error("Upload failed", error);
     } finally {
       setIsUploading(false);
     }
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
              
              {/* HUD Overlays - Scale Lock only */}
              {productScale && (
                <div className="absolute inset-0 pointer-events-none">
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="absolute top-8 right-8 flex flex-col items-end gap-2"
                   >
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-[#8A2BE2]/20 border border-[#8A2BE2] text-[#8A2BE2] rounded text-xs font-mono font-bold tracking-wider uppercase backdrop-blur-md">
                        <Lock size={12} />
                        尺寸锁定: {productScale === 'mini' ? '口红级' : productScale === 'normal' ? '水瓶级' : '大瓶级'}
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 rounded text-xs font-mono font-bold tracking-wider uppercase backdrop-blur-md">
                        <Fingerprint size={12} />
                        物理引擎: 强制生效
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

      {/* Timeline - 简化版 */}
      <div className="h-16 bg-[#0A0A0C] border-t border-[#2A2A2E] px-4 flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase">时间轴</span>
        <span className="text-xs text-zinc-600">视频生成后将显示在这里</span>
      </div>
    </div>
  );
}
