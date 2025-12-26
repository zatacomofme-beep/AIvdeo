import React from 'react';
import { Sparkles, ShoppingBag, Video, Package } from 'lucide-react';
import { useStore } from '../lib/store';
import { CreateProductPanel } from './CreateProductPanel';
import { cn } from '../lib/utils';
import { showToast } from '../lib/toast-utils';  // ✅ 导入 toast 工具

export function MainWorkspace() {
  const { 
    setShowDirector,
    setShowCreateProduct,
    savedProducts
  } = useStore();

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      <CreateProductPanel />
      
      {/* Business Tech Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <div className="w-full max-w-5xl mx-auto">
          {/* Simple Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
              创作你的专业视频
            </h1>
            <p className="text-lg text-slate-600">
              从上传商品到 AI 生成，只需三步
            </p>
          </div>

          {/* Main Action Cards - Business Tech */}
          <div className="grid grid-cols-2 gap-6 mb-10 mx-auto">
            <button
              onClick={() => setShowCreateProduct(true)}
              className="tech-card p-8 text-left group hover:border-tech/50 transition-all"
            >
              <div className="flex flex-col">
                <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-tech transition-colors shadow-tech-sm">
                  <ShoppingBag size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">创建商品</h3>
                <p className="text-sm text-slate-600 mb-4">上传商品图片，填写商品信息</p>
                <div className="badge-tech mt-auto">
                  {savedProducts.length > 0 ? `${savedProducts.length} 个商品` : '开始创建'}
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                if (savedProducts.length === 0) {
                  showToast.info('请先创建商品', '点击左侧“创建商品”开始，或前往“我的商品”页面。');
                  return;
                }
                setShowDirector(true);
              }}
              className={cn(
                "tech-card p-8 text-left group transition-all",
                savedProducts.length > 0 ? "hover:border-tech/50" : "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex flex-col">
                <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-tech transition-colors shadow-tech-sm">
                  <Sparkles size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">开始创作</h3>
                <p className="text-sm text-slate-600 mb-4">选择商品，AI 生成专业视频</p>
                <div className={cn(
                  "badge-tech mt-auto",
                  savedProducts.length > 0 ? "badge-tech-ai" : ""
                )}>
                  {savedProducts.length > 0 ? '点击开始创作' : '需要先创建商品'}
                </div>
              </div>
            </button>
          </div>

          {/* Process Steps - Clean Business Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8 mx-auto">
            <div className="tech-card p-6">
              <div className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">创建商品</h3>
              <p className="text-sm text-slate-600">上传图片，填写商品信息</p>
            </div>
            
            <div className="tech-card p-6">
              <div className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">配置参数</h3>
              <p className="text-sm text-slate-600">选择风格，设置视频参数</p>
            </div>
            
            <div className="tech-card p-6">
              <div className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center mb-4">
                <Sparkles size={20} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">AI 生成</h3>
              <p className="text-sm text-slate-600">一键生成专业营销视频</p>
            </div>
          </div>

          {/* Quick Tip */}
          {savedProducts.length === 0 && (
            <div className="tech-card p-5 bg-tech-light/20 border-tech/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
                  <Package className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">开始使用</p>
                  <p className="text-sm text-slate-600">
                    点击上方"创建商品"按钮，上传商品图片并填写信息，即可开始 AI 视频创作
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
