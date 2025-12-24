import React from 'react';
import { Sparkles, ShoppingBag, Video, Package } from 'lucide-react';
import { useStore } from '../lib/store';
import { CreateProductPanel } from './CreateProductPanel';

export function MainWorkspace() {
  const { 
    setShowDirector,
    setShowCreateProduct,
    savedProducts
  } = useStore();

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
      {/* 创建商品面板 */}
      <CreateProductPanel />
      
      {/* Hero Section with Modern Design */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background Gradient Orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-300/30 to-pink-300/30 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-blue-300/30 to-cyan-300/30 blur-[140px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="w-full max-w-6xl relative z-10">
          {/* Title with Modern Typography */}
          <div className="text-center mb-16">
            <h1 className="text-7xl font-black mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient">
                新的素材获取方式
              </span>
            </h1>
            <p className="text-2xl text-slate-600 font-medium tracking-wide">
              使用 AI 创建专业级视频内容
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full text-sm font-semibold text-purple-700 border border-purple-200/50">
                ✨ AI 驱动
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full text-sm font-semibold text-blue-700 border border-blue-200/50">
                🚀 极速生成
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full text-sm font-semibold text-green-700 border border-green-200/50">
                🎯 专业品质
              </div>
            </div>
          </div>

          {/* Main Action Cards */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            {/* 创建商品卡片 */}
            <button
              onClick={() => setShowCreateProduct(true)}
              className="glass-card rounded-xl p-8 backdrop-blur-xl bg-white/40 border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-yellow-500/30">
                  <ShoppingBag size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">创建商品</h3>
                <p className="text-slate-600 mb-4">上传商品图片，填写商品信息</p>
                <div className="px-4 py-2 bg-yellow-50 rounded-lg text-sm text-yellow-700 border border-yellow-200">
                  {savedProducts.length > 0 
                    ? `已有 ${savedProducts.length} 个商品` 
                    : '开始创建第一个商品'}
                </div>
              </div>
            </button>

            {/* 开始创作卡片 */}
            <button
              onClick={() => {
                if (savedProducts.length === 0) {
                  alert('请先创建商品！\n\n点击左侧"创建商品"开始，或前往"我的商品"页面。');
                  return;
                }
                setShowDirector(true);
              }}
              className="glass-card rounded-xl p-8 backdrop-blur-xl bg-white/40 border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
                  <Video size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">开始创作</h3>
                <p className="text-slate-600 mb-4">选择商品，AI 生成专业视频</p>
                <div className={`px-4 py-2 rounded-lg text-sm border ${
                  savedProducts.length > 0 
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200' 
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {savedProducts.length > 0 
                    ? '点击开始创作' 
                    : '需要先创建商品'}
                </div>
              </div>
            </button>
          </div>

          {/* Process Steps - Modern Cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/60 hover:border-blue-300/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
              
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-blue-500/30 text-2xl font-black">
                  1
                </div>
                <div className="text-xl font-black mb-3 text-slate-900">创建商品</div>
                <div className="text-sm text-slate-600 leading-relaxed">上传图片，填写商品信息，保存到商品库</div>
              </div>
            </div>
            
            <div className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/60 hover:border-purple-300/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
              
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-purple-500/30 text-2xl font-black">
                  2
                </div>
                <div className="text-xl font-black mb-3 text-slate-900">选择商品</div>
                <div className="text-sm text-slate-600 leading-relaxed">从商品库选择，配置视频参数和角色</div>
              </div>
            </div>
            
            <div className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/60 hover:border-cyan-300/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
              
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-cyan-500/30 text-2xl font-black">
                  3
                </div>
                <div className="text-xl font-black mb-3 text-slate-900">AI 生成</div>
                <div className="text-sm text-slate-600 leading-relaxed">一键生成专业营销视频</div>
              </div>
            </div>
          </div>

          {/* Quick Tip - Modern Alert */}
          {savedProducts.length === 0 && (
            <div className="mt-12 relative overflow-hidden p-6 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-300/40 rounded-2xl shadow-lg">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                  <Package className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-lg font-black text-blue-900 mb-2">💡 开始提示</p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    您还没有创建商品。点击上方“创建商品”按钮，上传商品图片并填写信息，即可开始 AI 视频创作！
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
