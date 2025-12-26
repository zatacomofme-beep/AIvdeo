import React, { useState } from 'react';
import { X, Sparkles, Loader2, ChevronRight, ChevronLeft, Wand2, Users, Plus, ShoppingBag } from 'lucide-react';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';
import { api } from '../../lib/api';
import { CharacterSelector } from './CharacterSelector';
import { showToast } from '../lib/toast-utils';

const API_BASE_URL = 'https://semopic.com';

export function DirectorPanel() {
  const { 
    showDirector, 
    setShowDirector, 
    currentStep,
    setCurrentStep,
    isGenerating,
    setGenerating,
    uploadedImages,
    setUploadedImages,
    saveProduct,
    savedProducts,
    currentProduct,
    setCurrentProduct,
    setVideoConfig,
    videoConfig,
    script,
    setScript,
    isGeneratingScript,
    setGeneratingScript,
    videoCount,
    setVideoCount,
    deductCredits,
    setCredits,
    credits,
    user,
    myCharacters,
    addCharacter,
    selectedCharacter,
    setSelectedCharacter,
    addGeneratedVideo,
    setShowCreateProduct,
    savePrompt
  } = useStore();
  
  // 视频任务轮询状态
  const [videoTaskId, setVideoTaskId] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [tempSelectedProduct, setTempSelectedProduct] = useState<typeof savedProducts[0] | null>(null);  // 新增：临时选中的商品
  
  // Step 1: Product Info
  const [productForm, setProductForm] = useState({
    name: currentProduct?.name || '',
    category: currentProduct?.category || '',
    usage: currentProduct?.usage || '',
    sellingPoints: currentProduct?.sellingPoints || ''
  });

  // Step 2: Video Config
  const [configForm, setConfigForm] = useState({
    country: videoConfig?.country || '',
    language: videoConfig?.language || '',
    style: videoConfig?.style || '', // 新增：视频风格
    orientation: videoConfig?.orientation || 'vertical' as 'horizontal' | 'vertical',  // ✅ 使用vertical/horizontal
    resolution: videoConfig?.resolution || '1080p' as '720p' | '1080p',
    duration: videoConfig?.duration || '15s' as '15s' | '25s'
  });

  // 选中商品的处理（修改：不立即跳转）
  const handleSelectProduct = (product: typeof savedProducts[0]) => {
    setTempSelectedProduct(product);  // 只是临时选中，不跳转
  };
  
  // 点击下一步时才确认选择
  const handleConfirmProduct = () => {
    if (!tempSelectedProduct) {
      alert('请先选择一个商品');
      return;
    }
    setCurrentProduct(tempSelectedProduct);
    setUploadedImages(tempSelectedProduct.imageUrls);
    setCurrentStep(2);  // 跳到选择角色
  };

  const handleSaveConfig = () => {
    if (!configForm.country || !configForm.language) {
      showToast.warning('请填写必填项', '投放国家和视频语言');
      return;
    }

    setVideoConfig(configForm);
    setCurrentStep(4);
  };

  const handleGenerateScript = async () => {
    if (credits < 30) {
      showToast.error('积分不足', `生成脚本需要30 Credits\n您当前积分：${credits} Credits\n\n请先充值后再试`);
      return;
    }
    
    setGeneratingScript(true);
    
    try {
      // 调用后端 API 使用 ChatGPT 生成脚本
      const response = await fetch(`${API_BASE_URL}/api/generate-script-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: currentProduct?.name || '',
          category: currentProduct?.category || '',
          usage: currentProduct?.usage || '',
          sellingPoints: currentProduct?.sellingPoints || '',
          country: configForm.country,
          language: configForm.language,
          duration: configForm.duration,
          style: configForm.style,
          characterName: selectedCharacter?.name,
          characterDescription: selectedCharacter?.description
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '脚本生成失败');
      }
      
      const result = await response.json();
      
      // 将脚本格式化为文本
      const scriptText = result.shots
        .map((shot: any) => `[${shot.time}] ${shot.scene}\n动作: ${shot.action}\n台词: ${shot.audio}\n情绪: ${shot.emotion}`)
        .join('\n\n');
      
      setScript(scriptText);
            
      // ✅ 调用后端API扣除积分
      console.log('[DirectorPanel] 准备扣除积分 - user:', user);
      console.log('[DirectorPanel] 准备扣除积分 - credits:', credits);
      if (user) {
        try {
          const result = await api.consumeCredits({
            user_id: user.id,
            amount: 30,
            action: '生成脚本',
            description: `生成${configForm.duration}${configForm.language}脚本`
          });
          console.log('[DirectorPanel] API返回积分:', result.credits);
          // 更新本地状态为最新积分
          setCredits(result.credits);
        } catch (error) {
          console.error('积分扣除失败:', error);
          console.error('积分扣除失败详情:', error instanceof Error ? error.message : error);
          // 失败也继续，只是本地扣除
          deductCredits(30);
        }
      } else {
        console.warn('[DirectorPanel] user为null，无法调用积分API！');
        deductCredits(30);
      }
            
      // ✅ 保存提示词到“我的提示词”
      savePrompt({
        productName: currentProduct?.name || '未命名产品',
        content: scriptText
      });
            
      showToast.success('脚本生成成功', `扣陆30 Credits\n剩余积分：${credits - 30} Credits\n\n已自动保存到“我的提示词”`);
    } catch (error) {
      console.error('脚本生成失败:', error);
      showToast.error('脚本生成失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleGenerate = async () => {
    if (!script.trim()) {
      showToast.warning('请输入或生成脚本', '');
      return;
    }

    if (credits < 70) {
      showToast.error('积分不足', `生成视频需要70 Credits\n您当前积分：${credits} Credits\n\n请先充值后再试`);
      return;
    }

    setGenerating(true);
    
    try {
      // 验证参数
      const duration = parseInt(configForm.duration.replace('s', ''));
      console.log('[视频生成] 参数验证:');
      console.log('  - script长度:', script.length);
      console.log('  - images数量:', uploadedImages?.length || 0);
      console.log('  - orientation:', configForm.orientation);
      console.log('  - duration:', duration, '(类型:', typeof duration, ')');
      
      if (!script || script.trim().length === 0) {
        showToast.error('脚本内容不能为空', '');
        setGenerating(false);
        return;
      }
      
      if (isNaN(duration) || duration <= 0) {
        showToast.error('视频时长参数错误', '');
        setGenerating(false);
        return;
      }
      
      // 调用后端API生成视频
      const result = await api.generateVideo(
        script,  // prompt
        uploadedImages || [],  // images
        configForm.orientation,  // orientation (portrait/landscape)
        configForm.resolution === '720p' ? 'small' : 'large',  // size
        duration  // duration
      );
      
      // 立即添加到视频列表
      const videoId = addGeneratedVideo({
        url: result.url || '',
        thumbnail: uploadedImages[0] || '',  // 使用第一张图作为缩略图
        script: script,
        productName: currentProduct?.name || '未命名产品',
        // 修复：如果有URL且状态是completed，则设为completed；否则设为processing
        status: (result.status === 'completed' && result.url) ? 'completed' : 'processing',
        taskId: result.task_id,
        progress: (result.status === 'completed' && result.url) ? 100 : 0
      });
      
      if (result.status === 'completed' && result.url) {
        // 视频立即完成，调用后端API扣除积分
        if (user) {
          try {
            const creditResult = await api.consumeCredits({
              user_id: user.id,
              amount: 70,
              action: '生成视频',
              description: `生成${duration}秒${configForm.orientation}视频`
            });
            setCredits(creditResult.credits);
          } catch (error) {
            console.error('积分扣除失败:', error);
            deductCredits(70);
          }
        }
        // 视频生成成功，静默处理
        console.log('✅ 视频生成成功，扣陉70 Credits，剩余:', credits - 70);
        setGenerating(false);
        setShowDirector(false);
      } else if (result.task_id) {
        // 需要轮询任务状态，先扣除积分
        if (user) {
          try {
            const creditResult = await api.consumeCredits({
              user_id: user.id,
              amount: 70,
              action: '生成视频',
              description: `生成${duration}秒${configForm.orientation}视频`
            });
            setCredits(creditResult.credits);
          } catch (error) {
            console.error('积分扣除失败:', error);
            deductCredits(70);
          }
        }
        setVideoTaskId(result.task_id);
        // 视频开始生成，静默处理
        console.log('✅ 视频开始生成，任务ID:', result.task_id);
        setGenerating(false);
        setShowDirector(false);
      }
    } catch (error) {
      console.error('视频生成失败:', error);
      alert('视频生成失败，请稍后重试');
      setGenerating(false);
    }
  };
  

  // 轮询视频生成状态
  const pollVideoStatus = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await api.queryVideoTask(taskId);
        
        if (status.progress !== undefined) {
          setVideoProgress(status.progress);
        }
        
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          // 视频生成完成，静默处理
          console.log('✅ 视频生成完成:', status.video_url);
          setGenerating(false);
          setShowDirector(false);
          setVideoProgress(0);
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          alert('❌ 视频生成失败，请重试');
          setGenerating(false);
          setVideoProgress(0);
        }
      } catch (error) {
        console.error('查询视频状态失败:', error);
        clearInterval(pollInterval);
        setGenerating(false);
        setVideoProgress(0);
      }
    }, 3000); // 每3秒查询一次
  };
  
  if (!showDirector) return null;

  const steps = [
    { num: 1, title: '商品信息' },
    { num: 2, title: '选择角色' },
    { num: 3, title: '视频配置' },
    { num: 4, title: '脚本生成' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
      <div className="w-full max-w-6xl h-[calc(100vh-2rem)] tech-card flex flex-col shadow-tech-lg rounded-lg overflow-hidden bg-white">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0 bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tech rounded-md flex items-center justify-center shadow-tech-sm text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800">AI 视频导演</h2>
              <p className="text-xs text-slate-500">智能创作专业视频分镜与脚本</p>
            </div>
          </div>
          <button
            onClick={() => setShowDirector(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between relative">
            {/* Connecting Line Background */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10" />
            
            {steps.map((step, index) => (
              <div key={step.num} className="flex items-center relative z-10 bg-slate-50 px-2 rounded-full">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-sm",
                    currentStep === step.num
                      ? "bg-tech text-white scale-110 shadow-tech-sm"
                      : currentStep > step.num
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-400"
                  )}>
                    {currentStep > step.num ? "✓" : step.num}
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    currentStep >= step.num ? "text-slate-800" : "text-slate-400"
                  )}>
                    {step.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Step 1: Select Product */}
          {currentStep === 1 && (
            <div className="space-y-6 relative z-10 animate-in slide-in-from-right-10 duration-500">
              {/* 选择商品区域 */}
              {savedProducts.length > 0 ? (
                <>
                  <div className="glass p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <p className="text-sm text-blue-800/80 leading-relaxed">
                      请选择一个商品开始创作视频，AI 将根据商品信息生成专业的视频脚本。
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <ShoppingBag size={16} className="text-yellow-500" />
                      选择商品
                    </label>
                    <div className="grid grid-cols-4 gap-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                      {savedProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className={cn(
                            "group relative p-3 bg-white border-2 rounded-xl transition-all duration-200 text-left overflow-hidden",
                            tempSelectedProduct?.id === product.id 
                              ? "border-yellow-400 shadow-lg shadow-yellow-100" 
                              : "border-slate-200 hover:border-yellow-400 hover:shadow-md"
                          )}
                        >
                          {/* 商品图片背景 */}
                          {product.imageUrls && product.imageUrls[0] && (
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity">
                              <img 
                                src={product.imageUrls[0]} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {/* 选中标记 */}
                          {tempSelectedProduct?.id === product.id && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          
                          {/* 内容 */}
                          <div className="relative z-10">
                            {/* 缩略图 */}
                            {product.imageUrls && product.imageUrls[0] ? (
                              <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-50 mb-2 border border-slate-100">
                                <img 
                                  src={product.imageUrls[0]} 
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            ) : (
                              <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-2">
                                <Sparkles className="text-slate-300" size={20} />
                              </div>
                            )}
                            
                            {/* 商品名称 */}
                            <h3 className="text-sm font-semibold text-slate-800 truncate group-hover:text-yellow-600 transition-colors mb-1">
                              {product.name}
                            </h3>
                            
                            {/* 类目标签 */}
                            <span className="inline-block text-xs px-2 py-0.5 bg-slate-50 text-slate-600 rounded truncate max-w-full group-hover:bg-yellow-50 group-hover:text-yellow-700 transition-colors">
                              {product.category}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 已选中商品的详情预览 */}
                  {tempSelectedProduct && (
                    <div className="glass p-4 rounded-xl border border-green-200 bg-green-50/50">
                      <div className="flex items-start gap-4">
                        {tempSelectedProduct.imageUrls && tempSelectedProduct.imageUrls[0] && (
                          <img 
                            src={tempSelectedProduct.imageUrls[0]} 
                            alt={tempSelectedProduct.name}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-green-200"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-green-900 mb-1">已选中：{tempSelectedProduct.name}</h4>
                          <p className="text-xs text-green-700 line-clamp-2">{tempSelectedProduct.sellingPoints}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-2">暂无商品</h3>
                  <p className="text-sm text-slate-500 mb-6">请先前往"我的商品"页面创建商品</p>
                  <button
                    onClick={() => {
                      setShowDirector(false);
                      setShowCreateProduct(true);
                    }}
                    className="btn-tech-ai px-6 py-3 inline-flex items-center gap-2"
                  >
                    <Plus size={20} />
                    创建第一个商品
                  </button>
                </div>
              )}  
            </div>
          )}

          {/* Step 2: Character Selection */}
          {currentStep === 2 && (
            <CharacterSelector
              onSelectCharacter={(character) => {
                setSelectedCharacter(character);
              }}
              selectedCharacter={selectedCharacter}
            />
          )}

          {/* Step 3: Video Config */}
          {currentStep === 3 && (
            <div className="space-y-6 relative z-10 animate-in slide-in-from-right-10 duration-500">
              <div className="tech-card p-4 bg-slate-50 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-tech mt-2 shrink-0" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  定制您的视频参数，我们支持生成适配不同平台（TikTok, Shorts, Reels）的视频格式。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    投放国家 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={configForm.country}
                      onChange={(e) => setConfigForm({ ...configForm, country: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-slate-900 appearance-none focus:outline-none focus:border-tech focus:ring-2 focus:ring-tech/20 transition-all hover:border-slate-300"
                    >
                      <option value="" className="text-slate-400">请选择投放国家</option>
                      <option value="china">🇨🇳 中国</option>
                      <option value="usa">🇺🇸 美国</option>
                      <option value="japan">🇯🇵 日本</option>
                      <option value="mexico">🇲🇽 墨西哥</option>
                      <option value="germany">🇩🇪 德国</option>
                      <option value="spain">🇪🇸 西班牙</option>
                      <option value="uk">🇬🇧 英国</option>
                      <option value="thailand">🇹🇭 泰国</option>
                      <option value="vietnam">🇻🇳 越南</option>
                      <option value="malaysia">🇲🇾 马来西亚</option>
                      <option value="indonesia">🇮🇩 印度尼西亚</option>
                      <option value="philippines">🇵🇭 菲律宾</option>
                      <option value="singapore">🇸🇬 新加坡</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    视频语言 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={configForm.language}
                      onChange={(e) => setConfigForm({ ...configForm, language: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-slate-900 appearance-none focus:outline-none focus:border-tech focus:ring-2 focus:ring-tech/20 transition-all hover:border-slate-300"
                    >
                      <option value="" className="text-slate-400">请选择视频语言</option>
                      <option value="zh-CN">中文</option>
                      <option value="en">英语 (English)</option>
                      <option value="de">德语 (Deutsch)</option>
                      <option value="es">西班牙语 (Español)</option>
                      <option value="th">泰语 (ไทย)</option>
                      <option value="vi">越南语 (Tiếng Việt)</option>
                      <option value="ja">日语 (日本語)</option>
                      <option value="fil">菲律宾语 (Filipino)</option>
                      <option value="ms">马来语 (Bahasa Melayu)</option>
                      <option value="id">印尼语 (Bahasa Indonesia)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  视频风格
                </label>
                <input
                  type="text"
                  value={configForm.style}
                  onChange={(e) => setConfigForm({ ...configForm, style: e.target.value })}
                  placeholder="如：UGC真实手持、专业产品展示、创意动画风格等"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-tech focus:ring-2 focus:ring-tech/20 transition-all hover:border-slate-300"
                />
                <p className="mt-2 text-xs text-slate-500">
                  描述您期望的视频风格，AI将据此生成相应的脚本和镜头设计
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  视频方向
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setConfigForm({ ...configForm, orientation: 'vertical' })}
                    className={cn(
                      "px-4 py-4 border-2 rounded-xl transition-all text-center relative overflow-hidden group",
                      configForm.orientation === 'vertical'
                        ? "border-yellow-400 bg-yellow-50 text-slate-900 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div className="text-base font-bold mb-1">📱 竖屏</div>
                    <div className="text-xs text-slate-500">9:16 (TikTok/Shorts)</div>
                    {configForm.orientation === 'vertical' && (
                      <div className="absolute inset-0 bg-yellow-400/5 pointer-events-none" />
                    )}
                  </button>
                  <button
                    onClick={() => setConfigForm({ ...configForm, orientation: 'horizontal' })}
                    className={cn(
                      "px-4 py-4 border-2 rounded-xl transition-all text-center relative overflow-hidden group",
                      configForm.orientation === 'horizontal'
                        ? "border-yellow-400 bg-yellow-50 text-slate-900 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div className="text-base font-bold mb-1">🖥️ 横屏</div>
                    <div className="text-xs text-slate-500">16:9 (YouTube)</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    分辨率
                  </label>
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setConfigForm({ ...configForm, resolution: '720p' })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                        configForm.resolution === '720p'
                          ? "bg-white text-slate-900 shadow-sm border border-slate-100"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      720P
                    </button>
                    <button
                      onClick={() => setConfigForm({ ...configForm, resolution: '1080p' })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                        configForm.resolution === '1080p'
                          ? "bg-white text-slate-900 shadow-sm border border-slate-100"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      1080P
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    时长
                  </label>
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setConfigForm({ ...configForm, duration: '15s' })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                        configForm.duration === '15s'
                          ? "bg-white text-slate-900 shadow-sm border border-slate-100"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      15s
                    </button>
                    <button
                      onClick={() => setConfigForm({ ...configForm, duration: '25s' })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                        configForm.duration === '25s'
                          ? "bg-white text-slate-900 shadow-sm border border-slate-100"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      25s
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Script */}
          {currentStep === 4 && (
            <div className="space-y-6 relative z-10 animate-in slide-in-from-right-10 duration-500">
              <div className="tech-card p-4 bg-tech-light/20 border-tech/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-tech mt-0.5 shrink-0" />
                     <p className="text-sm text-slate-700">
                       AI 已准备就绪，点击右侧按钮生成专业分镜脚本。
                     </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-amber-900">本次消耗</span>
                    <span className="px-2 py-1 bg-amber-100 border border-amber-300 rounded text-amber-900 text-sm font-bold">30 积分</span>
                  </div>
                  <button
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript}
                    className={cn(
                      "btn-tech-ai px-5 py-2.5 flex items-center gap-2 text-sm",
                      isGeneratingScript && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isGeneratingScript ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} />
                        AI 生成脚本
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 脚本编辑器 */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  脚本编辑器 <span className="text-red-500">*</span>
                </label>
                
                <div className="relative group">
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="等待生成或手动输入脚本..."
                    rows={15}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-tech focus:ring-2 focus:ring-tech/20 transition-all font-mono text-xs leading-relaxed custom-scrollbar"
                  />
                  <div className="absolute inset-0 rounded-md pointer-events-none border border-tech/0 group-hover:border-tech/20 transition-colors" />
                </div>
                
                <div className="flex justify-between items-center mt-3 px-1">
                  <span className="text-xs text-slate-500">
                    {script.length} 字符
                  </span>
                  {script && (
                    <button
                      onClick={() => setScript('')}
                      className="text-xs text-slate-500 hover:text-red-500 transition-colors"
                    >
                      清空脚本
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Back Button */}
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl flex items-center gap-2 transition-all font-medium"
              >
                <ChevronLeft size={18} />
                上一步
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Video Count Input (only show on step 4) */}
            {currentStep === 4 && (
              <div className="flex items-center gap-3 mr-4 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200">
                <label className="text-sm text-slate-600">生成数量:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={videoCount}
                  onChange={(e) => setVideoCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-center focus:outline-none focus:border-yellow-400 text-sm"
                />
                <span className="text-xs text-amber-600 font-mono font-bold">
                  {videoCount * 70} 积分
                </span>
              </div>
            )}

            {/* Next/Generate Button */}
            {currentStep < 4 ? (
              <button
                onClick={() => {
                  console.log('Next button clicked, currentStep:', currentStep);
                  if (currentStep === 1) {
                    handleConfirmProduct();  // 使用新的确认函数
                  } else if (currentStep === 2) {
                    setCurrentStep(3);
                  } else if (currentStep === 3) {
                    handleSaveConfig();
                  }
                }}
                disabled={currentStep === 1 && !tempSelectedProduct}
                className="btn-tech-ai px-8 py-3 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !script.trim()}
                className={cn(
                  "px-8 py-3 font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg transform hover:-translate-y-0.5",
                  isGenerating || !script.trim()
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed transform-none shadow-none"
                    : "btn-tech-ai"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    视频生成中...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    立即生成视频
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
