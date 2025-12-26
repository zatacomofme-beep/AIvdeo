import React from 'react';
import { useEffect } from 'react';
import { Package, Trash2, Clock, Tag, ShoppingBag, Plus } from 'lucide-react';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';

export function MyProducts() {
  const { savedProducts, deleteProduct, loadProduct, setShowDirector, setCurrentStep, setShowCreateProduct, user, loadUserData } = useStore();

  // ✅ 组件初始化时从数据库加载数据
  useEffect(() => {
    if (user?.id) {
      console.log('[MyProducts] 组件初始化，加载用户数据...');
      loadUserData(user.id);
    }
  }, [user?.id]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUseProduct = (productId: string) => {
    loadProduct(productId);
    setShowDirector(true);
    setCurrentStep(1);
  };

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      electronics: '电子产品',
      fashion: '服装配饰',
      beauty: '美妆护肤',
      home: '家居用品',
      food: '食品饮料',
      sports: '运动健身',
      other: '其他'
    };
    return map[category] || category;
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      <div className="p-8 pb-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900 flex items-center gap-3">
            <ShoppingBag className="text-tech" size={32} />
            我的商品
            <span className="badge-tech ml-2">
              {savedProducts.length}
            </span>
          </h2>
          <p className="text-slate-600 mt-2 text-sm">管理您的商品库，快速复用商品信息</p>
        </div>
        
        <button
          onClick={() => setShowCreateProduct(true)}
          className="btn-tech-ai flex items-center gap-2 px-6 py-3"
        >
          <Plus size={20} />
          创建商品
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar bg-slate-50">
        {savedProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center mb-4 border border-slate-200">
              <Package size={40} className="text-slate-300" />
            </div>
            <p className="text-lg text-slate-600">暂无商品</p>
            <p className="text-sm mt-2 mb-4">点击右上角"创建商品"按钮开始</p>
            <button
              onClick={() => setShowCreateProduct(true)}
              className="btn-tech-ai flex items-center gap-2 px-6 py-3"
            >
              <Plus size={20} />
              创建第一个商品
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {savedProducts.map((product) => (
              <div 
                key={product.id} 
                className="tech-card group relative overflow-hidden hover:shadow-tech-md transition-all"
              >
                <div className="h-32 relative bg-slate-50 p-2 flex items-center justify-center">
                  {product.imageUrls && product.imageUrls.length > 0 ? (
                    <img 
                      src={product.imageUrls[0]} 
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package size={32} className="text-slate-300" />
                  )}
                  
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded text-xs text-slate-600 border border-slate-200 flex items-center gap-1">
                    <Tag size={8} className="text-tech" />
                    {getCategoryLabel(product.category)}
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => deleteProduct(product.id)}
                      className="p-1.5 bg-white/90 backdrop-blur-sm text-red-500 hover:text-red-600 rounded-md hover:bg-white transition-colors"
                      title="删除商品"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-3 border-t border-slate-100 bg-white">
                  <h3 className="font-bold text-sm text-slate-900 truncate mb-1.5" title={product.name}>
                    {product.name}
                  </h3>
                  
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2 min-h-[2rem]">
                    {product.sellingPoints || '暂无卖点描述'}
                  </p>

                  <button 
                    onClick={() => handleUseProduct(product.id)}
                    className="w-full py-1.5 bg-slate-50 hover:bg-tech hover:text-white text-slate-600 rounded-md transition-all text-xs font-medium border border-slate-200 hover:border-tech"
                  >
                    使用此商品
                  </button>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={10} />
                    {formatDate(product.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
