import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, RefreshCw } from 'lucide-react';
import { useStore, Message } from '../../lib/store';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
// B 阶段改造：产品理解编辑确认面板

/** 组件：AI 导演控制台（驱动分阶段管线与聊天） */
export function DirectorConsole() {
  const { messages, addMessage, isGenerating, setProductScale, setProductName, setCharacter, setGenerating, uploadedImage, imageBase64, productName } = useStore();
  const { productUnderstanding, pipelineStage } = useStore.getState();
  const setPipelineStage = useStore.getState().setPipelineStage;
  const setProductUnderstanding = useStore.getState().setProductUnderstanding;
  const setMarketAnalysis = useStore.getState().setMarketAnalysis;
  const setCreativeStrategy = useStore.getState().setCreativeStrategy;
  const setVisualStyle = useStore.getState().setVisualStyle;
  const setScriptOptions = useStore.getState().setScriptOptions;
  const setSelectedScript = useStore.getState().setSelectedScript;
  const setScript = (script: any) => useStore.setState({ script });
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);  // 是否显示产品理解面板
  const [editPU, setEditPU] = React.useState<any>(null);
  const [selectedSize, setSelectedSize] = React.useState<'mini' | 'normal' | 'large' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editMA, setEditMA] = React.useState<any>(null);
  const [editCS, setEditCS] = React.useState<any>(null);
  const [styleCandidates, setStyleCandidates] = React.useState<any[]>([]);
  const [selectedStyle, setSelectedStyle] = React.useState<any>(null);
  const [localScripts, setLocalScripts] = React.useState<any[] | null>(null);

  /** 监听图片上传，进入 B 阶段并拉取产品理解 */
  useEffect(() => {
    if (uploadedImage && imageBase64 && !showForm) {
      (async () => {
        try {
          setIsLoading(true);
          setPipelineStage('product_understanding');
          setShowForm(true);
          addMessage({
            role: 'ai',
            content: '图片已上传成功！AI正在理解产品，请稍候...',
            type: 'text'
          });
          const res = await api.understandProduct({ imageBase64 });
          console.log('[DEBUG] API Response:', res);
          const pu = res.projectUpdate?.productUnderstanding || null;
          console.log('[DEBUG] Product Understanding:', pu);
          if (pu) {
            setProductUnderstanding(pu);
            const newEditPU = {
              productName: pu.productName || '',
              productType: pu.productType || '',
              attributes: pu.attributes || {},
              negativePrompts: pu.negativePrompts || [],  // 添加负面提示词
              sizeOptions: pu.sizeOptions || [
                { label: '💄 口红级 (10cm)', value: 'mini', description: '约10cm' },
                { label: '🥤 矿泉水瓶级 (30cm)', value: 'normal', description: '约30cm' },
                { label: '🍾 大酒瓶级 (50cm+)', value: 'large', description: '约50cm+' },
              ],
            };
            console.log('[DEBUG] Setting editPU:', newEditPU);
            setEditPU(newEditPU);
            addMessage({
              role: 'ai',
              content: 'AI 产品理解已就绪。请确认或编辑下方内容，然后进入市场分析。',
              type: 'text'
            });
          } else {
            // 兜底
            setEditPU({
              productName: '',
              productType: '',
              attributes: {},
              sizeOptions: [
                { label: '💄 口红级 (10cm)', value: 'mini', description: '约10cm' },
                { label: '🥤 矿泉水瓶级 (30cm)', value: 'normal', description: '约30cm' },
                { label: '🍾 大酒瓶级 (50cm+)', value: 'large', description: '约50cm+' },
              ],
            });
          }
        } catch (e) {
          addMessage({
            role: 'ai',
            content: '产品理解阶段出现问题，您可以手动填写并继续。',
            type: 'text'
          });
          setEditPU({
            productName: '',
            productType: '',
            attributes: {},
            sizeOptions: [
              { label: '💄 口红级 (10cm)', value: 'mini', description: '约10cm' },
              { label: '🥤 矿泉水瓶级 (30cm)', value: 'normal', description: '约30cm' },
              { label: '🍾 大酒瓶级 (50cm+)', value: 'large', description: '约50cm+' },
            ],
          });
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [uploadedImage, imageBase64, showForm, addMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]); // Add isLoading to dependency to scroll when loading bubbles appear

  /** 提交 B 阶段产品理解：写入 store 并推进到 C */
  const handleConfirmUnderstanding = () => {
    if (!editPU) return;
    const name = (editPU.productName || '').trim();
    setProductName(name || null);
    if (selectedSize) setProductScale(selectedSize);
    setProductUnderstanding(editPU);
    setPipelineStage('market_analysis');
    setShowForm(false);
    addMessage({
      role: 'ai',
      content: '已确认产品理解，进入市场定位分析阶段。',
      type: 'text'
    });
  };

  /** 触发 C 阶段：AI 市场分析，并允许用户编辑后确认进入 D */
  const handleRunMarketAnalysis = async () => {
    if (!productUnderstanding) return;
    setIsLoading(true);
    try {
      addMessage({ role: 'ai', content: '正在进行市场分析...', type: 'text' });
      const res = await api.analyzeMarket({ productUnderstanding });
      const ma = res.projectUpdate?.marketAnalysis || {};
      setMarketAnalysis(ma);
      setEditMA(ma);
      addMessage({ role: 'ai', content: '市场分析完成。请确认或编辑后进入创意策略。', type: 'text' });
    } catch (e) {
      addMessage({ role: 'ai', content: '市场分析失败，您可以手动填写。', type: 'text' });
      setEditMA({ market: '', segments: [], persona: { age: '', gender: '', traits: [] } });
    } finally {
      setIsLoading(false);
    }
  };

  /** 确认 C 阶段：写入并推进到 D 创意策略 */
  const handleConfirmMarket = () => {
    if (!editMA) return;
    setMarketAnalysis(editMA);
    setPipelineStage('creative_strategy');
    addMessage({ role: 'ai', content: '已确认市场定位，进入创意策略生成阶段。', type: 'text' });
  };

  /** 触发 D 阶段：AI 生成创意策略 */
  const handleRunStrategy = async () => {
    if (!productUnderstanding || !marketAnalysis) return;
    setIsLoading(true);
    try {
      addMessage({ role: 'ai', content: '正在生成创意策略...', type: 'text' });
      const res = await api.generateStrategy({ productUnderstanding, marketAnalysis });
      const cs = res.projectUpdate?.creativeStrategy || {};
      setCreativeStrategy(cs);
      setEditCS(cs);
      addMessage({ role: 'ai', content: '创意策略生成完成。请确认或编辑后进入风格匹配。', type: 'text' });
    } catch (e) {
      addMessage({ role: 'ai', content: '创意策略生成失败，您可以手动填写。', type: 'text' });
      setEditCS({ keyMessage: '', painReliefArc: [], tone: '', narrative: '' });
    } finally {
      setIsLoading(false);
    }
  };

  /** 确认 D 阶段：写入并推进到 E 风格匹配 */
  const handleConfirmStrategy = () => {
    if (!editCS) return;
    setCreativeStrategy(editCS);
    setPipelineStage('style_matching');
    addMessage({ role: 'ai', content: '已确认创意策略，进入视觉风格匹配阶段。', type: 'text' });
  };

  /** 触发 E 阶段：AI 风格候选生成 */
  const handleRunStyleMatch = async () => {
    if (!productUnderstanding || !marketAnalysis || !creativeStrategy) return;
    setIsLoading(true);
    try {
      addMessage({ role: 'ai', content: '正在匹配视觉风格...', type: 'text' });
      const res = await api.matchStyle({ productUnderstanding, marketAnalysis, creativeStrategy });
      const candidates = res.projectUpdate?.styleCandidates || [];
      setStyleCandidates(candidates);
      addMessage({ role: 'ai', content: '已生成风格候选。请选择其一进入脚本生成。', type: 'text' });
    } catch (e) {
      addMessage({ role: 'ai', content: '风格匹配失败，您可以手动选择。', type: 'text' });
      setStyleCandidates([
        { id: 'authentic', label: '真实', pros: ['亲近UGC'], cons: ['可能略显朴素'] },
        { id: 'delicate', label: '精致', pros: ['画面高级'], cons: ['成本较高'] },
        { id: 'trendy', label: '潮流', pros: ['年轻化'], cons: ['易过时'] },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /** 确认 E 阶段：选择风格并推进到 F 脚本生成 */
  const handleConfirmStyle = () => {
    if (!selectedStyle) return;
    setVisualStyle(selectedStyle);
    setPipelineStage('scripts_generated');
    addMessage({ role: 'ai', content: '风格已选择，开始生成三套脚本。', type: 'text' });
    handleRunGenerateScripts();
  };

  /** 触发 F 阶段：生成三套脚本 */
  const handleRunGenerateScripts = async () => {
    if (!productUnderstanding || !marketAnalysis || !creativeStrategy || !selectedStyle) return;
    setIsLoading(true);
    try {
      const res = await api.generateScripts({
        productUnderstanding,
        marketAnalysis,
        creativeStrategy,
        visualStyle: selectedStyle,
      });
      const opts = res.projectUpdate?.scriptOptions || [];
      setScriptOptions(opts);
      setLocalScripts(opts);
      addMessage({ role: 'ai', content: '三套脚本已生成。请选择其中一套作为最终脚本。', type: 'text' });
      setPipelineStage('scripts_generated');
    } catch (e) {
      addMessage({ role: 'ai', content: '脚本生成失败，请重试或手动编辑。', type: 'text' });
    } finally {
      setIsLoading(false);
    }
  };

  /** G 阶段：选择脚本并推进到准备渲染 */
  const handleSelectScript = (index: number) => {
    if (!localScripts || !localScripts[index]) return;
    const chosen = localScripts[index];
    setSelectedScript(chosen);
    setPipelineStage('ready_to_render');
    addMessage({ role: 'ai', content: `已选择第 ${index + 1} 套脚本。点击下方按钮进行视频生成。`, type: 'text' });
  };

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
      if (response.projectUpdate?.scale) {
        setProductScale(response.projectUpdate.scale);
      }
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

  /** 组装 H 阶段最终视频生成 Prompt（融合上下文与脚本） */
  const buildFinalPrompt = (): string => {
    const pu = useStore.getState().productUnderstanding;
    const ma = useStore.getState().marketAnalysis;
    const cs = useStore.getState().creativeStrategy;
    const vs = useStore.getState().visualStyle;
    const scale = useStore.getState().productScale;
    const chosenScript = useStore.getState().selectedScript || [];
    const name = useStore.getState().productName;
    
    const constraintsPart = [
      scale ? `尺寸锁定: ${scale === 'mini' ? '口红级(10cm)' : scale === 'normal' ? '水瓶级(30cm)' : '大瓶级(50cm+)'}.` : '',
      pu?.attributes?.material ? `材质: ${pu.attributes.material}.` : '',
      pu?.attributes?.color ? `颜色: ${pu.attributes.color}.` : '',
      pu?.attributes?.shape ? `形态: ${pu.attributes.shape}.` : ''
    ].filter(Boolean).join(' ');
    
    const characterPart = [
      ma?.market ? `市场: ${ma.market}.` : '',
      ma?.persona?.age ? `年龄段: ${ma.persona.age}.` : '',
      ma?.persona?.gender ? `性别: ${ma.persona.gender}.` : '',
      (ma?.persona?.traits && ma.persona.traits.length) ? `特征: ${ma.persona.traits.join('、')}.` : ''
    ].filter(Boolean).join(' ');
    
    const strategyPart = [
      cs?.keyMessage ? `核心信息: ${cs.keyMessage}.` : '',
      (cs?.painReliefArc && cs.painReliefArc.length) ? `痛点-解决-转折-满意: ${cs.painReliefArc.join(' -> ')}.` : '',
      cs?.tone ? `语气: ${cs.tone}.` : '',
      cs?.narrative ? `叙事: ${cs.narrative}.` : ''
    ].filter(Boolean).join(' ');
    
    const stylePart = vs?.label ? `视觉风格: ${vs.label}.` : '';
    
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
      constraintsPart ? `[CONSTRAINTS] ${constraintsPart}` : '',
      characterPart ? `[CHARACTER] ${characterPart}` : '',
      strategyPart ? `[STRATEGY] ${strategyPart}` : '',
      stylePart ? `[STYLE] ${stylePart}` : '',
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
      
      // 组装最终 Prompt（H 阶段）
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
    <div className="w-[400px] h-screen bg-[#121214] border-l border-[#2A2A2E] flex flex-col shrink-0 z-20">
      
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#2A2A2E]/50 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="text-[#8A2BE2]" size={20} />
          <h2 className="text-md font-bold text-white">AI 导演控制台</h2>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
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
          
          {/* 产品理解面板（B 阶段） */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="my-4"
            >
              <div className="space-y-4 p-6 bg-[#1E1E22] rounded-lg border border-[#2A2A2E]">
                <h3 className="text-lg font-bold text-white">产品理解（可编辑）</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300">产品名称</label>
                    <Input
                      value={editPU?.productName || ''}
                      onChange={(e) => setEditPU((prev: any) => ({ ...prev, productName: e.target.value }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">产品类型</label>
                    <Input
                      value={editPU?.productType || ''}
                      onChange={(e) => setEditPU((prev: any) => ({ ...prev, productType: e.target.value }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-300">材质</label>
                    <Input
                      value={editPU?.attributes?.material || ''}
                      onChange={(e) => setEditPU((prev: any) => ({ ...prev, attributes: { ...prev.attributes, material: e.target.value } }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">颜色</label>
                    <Input
                      value={editPU?.attributes?.color || ''}
                      onChange={(e) => setEditPU((prev: any) => ({ ...prev, attributes: { ...prev.attributes, color: e.target.value } }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">形态</label>
                    <Input
                      value={editPU?.attributes?.shape || ''}
                      onChange={(e) => setEditPU((prev: any) => ({ ...prev, attributes: { ...prev.attributes, shape: e.target.value } }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-300">负面提示词（逗号分隔，用于避免视频中产品变形）</label>
                  <Input
                    value={(editPU?.negativePrompts || []).join(', ')}
                    onChange={(e) => setEditPU((prev: any) => ({ ...prev, negativePrompts: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }))}
                    placeholder="如：deformed, distorted, malformed, low quality"
                    className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">💡 根据Sora 2教程：负面提示词帮助AI避免产品变形、失真等问题</p>
                </div>
                <div>
                  <label className="text-sm text-gray-300">尺寸建议（选择其一）</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(editPU?.sizeOptions || []).map((opt: any) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedSize(opt.value)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                          selectedSize === opt.value
                            ? "bg-[#8A2BE2] text-white border-[#8A2BE2]"
                            : "bg-[#2A2A2E] text-cyan-400 border-cyan-900/30 hover:bg-cyan-950/30 hover:border-cyan-500/50"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmUnderstanding}
                    className="bg-gradient-to-r from-[#8A2BE2] to-[#6A5ACD] text-white"
                    disabled={isLoading}
                  >
                    确认并进入市场分析
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!imageBase64) return;
                      setIsLoading(true);
                      try {
                        const res = await api.understandProduct({ imageBase64 });
                        const pu = res.projectUpdate?.productUnderstanding || null;
                        if (pu) {
                          setProductUnderstanding(pu);
                          setEditPU({
                            productName: pu.productName || '',
                            productType: pu.productType || '',
                            attributes: pu.attributes || {},
                            sizeOptions: pu.sizeOptions || editPU?.sizeOptions,
                          });
                        }
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="bg-transparent border-[#2A2A2E] text-white"
                  >
                    重新识别
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* C 阶段：市场定位分析面板 */}
          {pipelineStage === 'market_analysis' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="my-4">
              <div className="space-y-4 p-6 bg-[#1E1E22] rounded-lg border border-[#2A2A2E]">
                <h3 className="text-lg font-bold text-white">市场定位分析（可编辑）</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300">目标市场</label>
                    <Input
                      value={editMA?.market || ''}
                      onChange={(e) => setEditMA((prev: any) => ({ ...(prev || {}), market: e.target.value }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">核心细分（逗号分隔）</label>
                    <Input
                      value={(editMA?.segments || []).join(',')}
                      onChange={(e) => setEditMA((prev: any) => ({ ...(prev || {}), segments: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-300">年龄段</label>
                    <Input
                      value={editMA?.persona?.age || ''}
                      onChange={(e) => setEditMA((prev: any) => ({ ...(prev || {}), persona: { ...(prev?.persona || {}), age: e.target.value } }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">性别</label>
                    <Input
                      value={editMA?.persona?.gender || ''}
                      onChange={(e) => setEditMA((prev: any) => ({ ...(prev || {}), persona: { ...(prev?.persona || {}), gender: e.target.value } }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">特征（逗号分隔）</label>
                    <Input
                      value={(editMA?.persona?.traits || []).join(',')}
                      onChange={(e) => setEditMA((prev: any) => ({ ...(prev || {}), persona: { ...(prev?.persona || {}), traits: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRunMarketAnalysis} className="bg-[#2A2A2E] text-white">AI 生成市场分析</Button>
                  <Button onClick={handleConfirmMarket} className="bg-gradient-to-r from-[#8A2BE2] to-[#6A5ACD] text-white">确认并进入创意策略</Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* D 阶段：创意策略面板 */}
          {pipelineStage === 'creative_strategy' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="my-4">
              <div className="space-y-4 p-6 bg-[#1E1E22] rounded-lg border border-[#2A2A2E]">
                <h3 className="text-lg font-bold text-white">创意策略（可编辑）</h3>
                <div>
                  <label className="text-sm text-gray-300">核心信息</label>
                  <Input
                    value={editCS?.keyMessage || ''}
                    onChange={(e) => setEditCS((prev: any) => ({ ...(prev || {}), keyMessage: e.target.value }))}
                    className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">痛点-解决-转折-满意（逗号分隔）</label>
                  <Input
                    value={(editCS?.painReliefArc || []).join(',')}
                    onChange={(e) => setEditCS((prev: any) => ({ ...(prev || {}), painReliefArc: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300">语气风格</label>
                    <Input
                      value={editCS?.tone || ''}
                      onChange={(e) => setEditCS((prev: any) => ({ ...(prev || {}), tone: e.target.value }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">叙事策略简述</label>
                    <Input
                      value={editCS?.narrative || ''}
                      onChange={(e) => setEditCS((prev: any) => ({ ...(prev || {}), narrative: e.target.value }))}
                      className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRunStrategy} className="bg-[#2A2A2E] text-white">AI 生成策略</Button>
                  <Button onClick={handleConfirmStrategy} className="bg-gradient-to-r from-[#8A2BE2] to-[#6A5ACD] text-white">确认并进入风格匹配</Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* E 阶段：风格匹配面板 */}
          {pipelineStage === 'style_matching' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="my-4">
              <div className="space-y-4 p-6 bg-[#1E1E22] rounded-lg border border-[#2A2A2E]">
                <h3 className="text-lg font-bold text-white">视觉风格匹配</h3>
                <div className="flex gap-2">
                  <Button onClick={handleRunStyleMatch} className="bg-[#2A2A2E] text-white">AI 生成风格候选</Button>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {styleCandidates.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedStyle(opt)}
                      className={cn(
                        "p-3 text-left rounded border transition-all",
                        selectedStyle?.id === opt.id
                          ? "bg-[#8A2BE2] text-white border-[#8A2BE2]"
                          : "bg-[#2A2A2E] text-cyan-400 border-cyan-900/30 hover:bg-cyan-950/30 hover:border-cyan-500/50"
                      )}
                    >
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-xs mt-1 text-gray-300">优点：{(opt.pros || []).join('、')}</div>
                      <div className="text-xs mt-1 text-gray-400">缺点：{(opt.cons || []).join('、')}</div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleConfirmStyle} className="bg-gradient-to-r from-[#8A2BE2] to-[#6A5ACD] text-white">确认风格并生成脚本</Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* F/G 阶段：三脚本生成与选择 */}
          {pipelineStage === 'scripts_generated' && localScripts && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="my-4">
              <div className="space-y-4 p-6 bg-[#1E1E22] rounded-lg border border-[#2A2A2E]">
                <h3 className="text-lg font-bold text-white">三套脚本（选择其一）</h3>
                <div className="grid grid-cols-3 gap-4">
                  {localScripts.map((script, idx) => (
                    <div key={idx} className="p-3 bg-[#0A0A0C] border border-[#2A2A2E] rounded">
                      <div className="text-xs text-muted-foreground mb-2">脚本 {idx + 1}</div>
                      <div className="space-y-2">
                        {(script || []).map((shot: any, si: number) => (
                          <div key={si} className="text-xs text-gray-300">
                            <div className="font-mono text-cyan-400">{shot.time}</div>
                            <div>{shot.scene}</div>
                            <div className="text-gray-400">{shot.audio}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2">
                        <Button onClick={() => handleSelectScript(idx)} className="w-full bg-[#2A2A2E] text-white hover:bg-[#8A2BE2]">选择脚本 {idx + 1}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
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
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#121214] border-t border-[#2A2A2E] shrink-0">
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
