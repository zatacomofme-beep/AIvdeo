import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, RefreshCw } from 'lucide-react';
import { useStore, Message } from '../../lib/store';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

/** 组件：AI 导演控制台（简化版，去掉视觉识别功能） */
export function DirectorConsole() {
  const { messages, addMessage, isGenerating, setProductName, setCharacter, setGenerating, uploadedImage, productName } = useStore();
  const setScript = (script: any) => useStore.setState({ script });
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
  }, [messages, isLoading]);

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
      // 2. Call Backend API - 携带 product_name 到 context + 对话历史
      console.log('[DirectorConsole] 发送消息, productName:', productName);
      
      // 构建对话历史（去除欢迎消息）
      const history = messages
        .filter(msg => msg.id !== 'welcome')  // 过滤欢迎消息
        .map(msg => ({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        }));
      
      const response = await api.sendChatMessage(userText, { product_name: productName }, undefined, history);
      
      // 3. Handle AI Response
      addMessage(response.message);
      
      // Optional: Handle state updates from backend
      if (response.projectUpdate?.character) {
        console.log('[DirectorConsole] 收到角色数据:', response.projectUpdate.character);
        setCharacter(response.projectUpdate.character);
      }
      if (response.projectUpdate?.script) {
        setScript(response.projectUpdate.script);
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

  /** 组装最终视频生成 Prompt */
  const buildFinalPrompt = (): string => {
    const name = useStore.getState().productName;
    const chosenScript = useStore.getState().script || [];
    
    const scriptPart = (chosenScript || []).map((shot: any) => {
      const t = shot.time ? `${shot.time}` : '';
      const s = shot.scene ? `场景: ${shot.scene}` : '';
      const a = shot.audio ? `台词/配音: ${shot.audio}` : '';
      const e = shot.emotion ? `情绪: ${shot.emotion}` : '';
      const ac = shot.action ? `动作: ${shot.action}` : '';
      return [t, s, ac, a, e].filter(Boolean).join('；');
    }).join(' ｜ ');
    
    const titlePart = name ? `产品: ${name}` : '产品展示';
    
    const finalPrompt = [
      `[TITLE] ${titlePart}`,
      scriptPart ? `[SCRIPT] ${scriptPart}` : '',
      `[SCENE] 保持真实光线，画面简洁不喧宾夺主，竖屏，10秒。`
    ].filter(Boolean).join('\n');
    
    return finalPrompt;
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
      
      // 组装最终 Prompt
      const finalPrompt = buildFinalPrompt();
      
      // 调用视频生成 API
      const result = await api.generateVideo(
        finalPrompt,
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
    <div className="w-full h-full bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
      
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="text-yellow-400" size={20} />
          <h2 className="text-md font-bold text-white">AI Director</h2>
        </div>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <RefreshCw size={16} />
        </Button>
      </div>

      {/* Chat Stream */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
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
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-black rounded-tr-sm" 
                    : "bg-gray-900 text-gray-200 border border-gray-600 rounded-tl-sm"
                )}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className="min-h-[1em]">{line}</p>
                  ))}
                </div>
                
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start"
            >
              <div className="px-4 py-3 rounded-2xl text-sm bg-[#1E1E22] text-gray-200 border border-[#2A2A2E] rounded-tl-sm">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#8A2BE2] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#8A2BE2] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#8A2BE2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-gray-400">AI 导演思考中...</span>
                </div>
              </div>
            </motion.div>
          )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 shrink-0">
        <div className="space-y-3">
          {/* Generate Video Button */}
          {uploadedImage && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-medium py-3 rounded-xl shadow-lg shadow-yellow-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  生成视频 (70 积分)
                </>
              )}
            </Button>
          )}
          
          {/* Chat Input */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="与 AI 导演对话..."
              className="flex-1 bg-gray-900 border-gray-600 text-white placeholder:text-gray-400 rounded-xl h-12 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl h-12 w-12 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}