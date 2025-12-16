import React, { useCallback } from 'react';
import { useStore } from '../../lib/store';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Upload, X, Maximize2, Lock, Fingerprint, Loader2 } from 'lucide-react';
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
              
              {/* HUD Overlays - Only show if image is present */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Scale Lock HUD */}
                {productScale && (
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
                )}
                
                {/* Clear Button */}
                <button 
                  onClick={() => setUploadedImage("")} // Fixed: Passing empty string instead of null to match type
                  className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full hover:bg-red-500/20 hover:text-red-400 pointer-events-auto transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
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

      {/* Timeline (Static Mock for MVP) */}
      <div className="h-48 bg-[#0A0A0C] border-t border-[#2A2A2E] p-4">
        <div className="flex items-center justify-between mb-2">
           <span className="text-xs font-mono text-muted-foreground uppercase">时间轴预览</span>
           <div className="flex gap-2">
             <button className="p-1 hover:bg-white/10 rounded"><Maximize2 size={12} className="text-muted-foreground" /></button>
           </div>
        </div>
        
        {/* Timeline Tracks */}
        <div className="relative h-full w-full overflow-hidden">
          {/* Time Rulers */}
          <div className="flex justify-between text-[10px] text-[#2A2A2E] font-mono border-b border-[#2A2A2E] pb-1 mb-2">
            <span>00:00</span><span>00:05</span><span>00:10</span><span>00:15</span>
          </div>
          
          {/* Video Track */}
          <div className="h-12 bg-[#121214] rounded mb-2 flex items-center relative overflow-hidden">
             {/* Mock clips */}
             <div className="absolute left-0 w-[30%] h-full bg-purple-900/30 border-r border-purple-500/30 flex items-center justify-center text-[10px] text-purple-300">
               开场 (钩子)
             </div>
             <div className="absolute left-[30%] w-[40%] h-full bg-blue-900/30 border-r border-blue-500/30 flex items-center justify-center text-[10px] text-blue-300">
               产品演示
             </div>
             <div className="absolute left-[70%] w-[30%] h-full bg-green-900/30 flex items-center justify-center text-[10px] text-green-300">
               行动号召
             </div>
          </div>
          
          {/* Audio Track */}
          <div className="h-8 bg-[#121214] rounded flex items-center relative">
             <div className="w-full h-4 mx-2" style={{
               background: 'repeating-linear-gradient(90deg, #2A2A2E 0px, #2A2A2E 2px, transparent 2px, transparent 4px)'
             }} />
          </div>
        </div>
      </div>
    </div>
  );
}
