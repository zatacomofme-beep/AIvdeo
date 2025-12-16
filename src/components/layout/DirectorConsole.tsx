import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, RefreshCw } from 'lucide-react';
import { useStore, Message } from '../../lib/store';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export function DirectorConsole() {
  const { messages, addMessage, isGenerating, setProductScale, setGenerating, uploadedImage } = useStore();
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]); // Add isLoading to dependency to scroll when loading bubbles appear

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userText = inputValue;
    setInputValue('');
    setIsLoading(true);

    // 1. Add User Message
    addMessage({
      role: 'user',
      content: userText,
      type: 'text'
    });

    try {
      // 2. Call Backend API
      const response = await api.sendChatMessage(userText, {});
      
      // 3. Handle AI Response
      addMessage(response.message);
      
      // Optional: Handle state updates from backend (e.g. if AI infers parameters)
      if (response.projectUpdate?.scale) {
        setProductScale(response.projectUpdate.scale);
      }
    } catch (error) {
      addMessage({
        role: 'ai',
        content: "错误：无法连接到 AI 导演服务。请检查网络或后端状态。",
        type: 'text'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = async (chip: { label: string, value: string }) => {
     // 1. Add User Selection
     addMessage({
       role: 'user',
       content: `已选择: ${chip.label}`,
       type: 'text'
     });
     
     setIsLoading(true);

     try {
       // 2. Call Backend API to lock physics
       const response = await api.lockPhysics(chip.value);
       
       // 3. Update UI
       addMessage(response.message);
       if (response.projectUpdate?.scale) {
         setProductScale(response.projectUpdate.scale);
       }
     } catch (error) {
       console.error(error);
     } finally {
       setIsLoading(false);
     }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      // 添加生成开始消息
      addMessage({
        role: 'ai',
        content: '正在调用 Sora-2 视频生成模型，请稍候...',
        type: 'text'
      });

      // 获取当前上传的图片
      const images = uploadedImage ? [uploadedImage] : [];
      
      // 调用视频生成 API
      const result = await api.generateVideo(
        "产品展示视频，柔和光线，电影感，缓慢旋转",
        images,
        'portrait',  // 竖屏
        'large',     // 高清
        10           // 10秒
      );

      // 检查生成状态
      if (result.status === 'completed' && result.url) {
        addMessage({
          role: 'ai',
          content: `视频生成完成！

视频地址：${result.url}

已发送到您的作品库。`,
          type: 'text'
        });
      } else if (result.status === 'processing' && result.task_id) {
        addMessage({
          role: 'ai',
          content: `视频生成中...任务 ID: ${result.task_id}\n\n${result.message || '请稍候，生成需要一些时间'}，您可以稍后查询任务状态。`,
          type: 'text'
        });
      } else {
        addMessage({
          role: 'ai',
          content: `视频生成请求已提交，状态：${result.status}`,
          type: 'text'
        });
      }
    } catch (error) {
      console.error(error);
      addMessage({
        role: 'ai',
        content: `错误：视频生成失败。${error instanceof Error ? error.message : '请检查后端服务是否正常运行。'}`,
        type: 'text'
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-[400px] h-screen bg-[#121214] border-l border-[#2A2A2E] flex flex-col shrink-0 z-20">
      
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#2A2A2E]/50">
        <div className="flex items-center gap-2">
          <Bot className="text-[#8A2BE2]" size={20} />
          <h2 className="text-md font-bold text-white">AI 导演控制台</h2>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
          <RefreshCw size={16} />
        </Button>
      </div>

      {/* Chat Stream */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col max-w-[90%]",
                  msg.role === 'user' ? "ml-auto items-end" : "items-start"
                )}
              >
                {/* Bubble */}
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-gradient-to-br from-[#8A2BE2] to-[#6A5ACD] text-white rounded-tr-sm" 
                    : "bg-[#1E1E22] text-gray-200 border border-[#2A2A2E] rounded-tl-sm"
                )}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className="min-h-[1em]">{line}</p>
                  ))}
                </div>

                {/* Chips */}
                {msg.type === 'scale_selector' && msg.chips && (
                  <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                    {msg.chips.map((chip) => (
                      <button
                        key={chip.value}
                        onClick={() => handleChipClick(chip)}
                        className="px-3 py-1.5 text-xs font-medium bg-[#2A2A2E] text-cyan-400 border border-cyan-900/30 rounded-full hover:bg-cyan-950/30 hover:border-cyan-500/50 transition-all"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Meta */}
                <span className="text-[10px] text-muted-foreground mt-1 px-1 opacity-50">
                  {msg.role === 'ai' ? 'AI 导演' : '你'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Loading Indicator */}
          {isLoading && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               className="flex items-center gap-2 text-xs text-muted-foreground ml-2"
             >
               <div className="w-2 h-2 bg-[#8A2BE2] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
               <div className="w-2 h-2 bg-[#8A2BE2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
               <div className="w-2 h-2 bg-[#8A2BE2] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
             </motion.div>
          )}
          
          {/* Spacer for scroll */}
          <div className="h-4" />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-[#121214] border-t border-[#2A2A2E]">
        <div className="relative">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="描述您的构想..."
            disabled={isLoading}
            className="bg-[#050505] border-[#2A2A2E] rounded-full pr-12 focus-visible:ring-[#8A2BE2] text-white disabled:opacity-50"
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-1 top-1 h-8 w-8 rounded-full bg-[#2A2A2E] hover:bg-[#8A2BE2] text-white transition-colors"
          >
            <Send size={14} />
          </Button>
        </div>

        {/* Magic Button */}
        <Button 
          onClick={handleGenerate}
          className={cn(
            "w-full mt-4 bg-gradient-to-r from-[#8A2BE2] to-[#6A5ACD] text-white font-semibold tracking-wide shadow-[0_0_15px_rgba(138,43,226,0.4)] transition-all",
            (isGenerating || isLoading) && "opacity-80 cursor-not-allowed"
          )}
          disabled={isGenerating || isLoading}
        >
           {isGenerating ? (
             <span className="flex items-center gap-2">
               <span className="h-2 w-2 bg-white rounded-full animate-bounce" />
               渲染中...
             </span>
           ) : (
             <span className="flex items-center gap-2">
               <Sparkles size={16} />
               生成视频 (50 点数)
             </span>
           )}
        </Button>
      </div>
    </div>
  );
}
