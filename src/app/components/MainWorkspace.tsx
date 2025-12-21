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
    <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
      {/* 创建商品面板 */}
      <CreateProductPanel />
      
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          {/* Title */}
          <h1 className="text-5xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 animate-pulse drop-shadow-sm">
            新的素材获取方式
            <span className="block text-xl font-normal text-slate-500 mt-2 tracking-widest uppercase">Create Professional Videos with AI</span>
          </h1>

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

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="glass p-6 rounded-xl bg-white/40 border border-slate-200 hover:bg-white/60 transition-colors group cursor-default shadow-sm hover:shadow-md">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform border border-blue-200 shadow-sm">1</div>
              <div className="text-lg font-medium mb-1 text-slate-800">创建商品</div>
              <div className="text-sm text-slate-500 leading-relaxed">上传图片，填写商品信息，保存到商品库</div>
            </div>
            <div className="glass p-6 rounded-xl bg-white/40 border border-slate-200 hover:bg-white/60 transition-colors group cursor-default shadow-sm hover:shadow-md">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-3 group-hover:scale-110 transition-transform border border-purple-200 shadow-sm">2</div>
              <div className="text-lg font-medium mb-1 text-slate-800">选择商品</div>
              <div className="text-sm text-slate-500 leading-relaxed">从商品库选择，配置视频参数和角色</div>
            </div>
            <div className="glass p-6 rounded-xl bg-white/40 border border-slate-200 hover:bg-white/60 transition-colors group cursor-default shadow-sm hover:shadow-md">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 mb-3 group-hover:scale-110 transition-transform border border-cyan-200 shadow-sm">3</div>
              <div className="text-lg font-medium mb-1 text-slate-800">AI 生成</div>
              <div className="text-sm text-slate-500 leading-relaxed">一键生成专业营销视频</div>
            </div>
          </div>

          {/* Quick Tip */}
          {savedProducts.length === 0 && (
            <div className="mt-8 p-4 bg-blue-50/80 border border-blue-200 rounded-xl max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <Package className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">💡 开始提示</p>
                  <p className="text-sm text-blue-700">
                    您还没有创建商品。点击上方"创建商品"按钮，上传商品图片并填写信息，即可开始AI视频创作！
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
