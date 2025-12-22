import React, { useState } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';
import { api } from '../../lib/api';

export function CreateProductPanel() {
  const { 
    showCreateProduct, 
    setShowCreateProduct,
    saveProduct,
    uploadedImages,
    setUploadedImages,
    addUploadedImage,
    removeUploadedImage
  } = useStore();

  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    usage: '',
    sellingPoints: ''
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      alert('最多只能上传5张图片');
      e.target.value = ''; // 清空input
      return;
    }

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('开始上传图片:', file.name);
        
        const url = await api.uploadImage(file);
        console.log('图片上传成功:', url);
        
        addUploadedImage(url);
      }
      alert('✅ 图片上传成功！');
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('❌ 图片上传失败，请重试');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // 清空input，允许再次选择相同文件
    }
  };

  const handleSave = () => {
    if (!productForm.name || !productForm.category) {
      alert('请填写必填项：品名和类目');
      return;
    }

    if (uploadedImages.length === 0) {
      alert('请至少上传一张商品图片');
      return;
    }

    saveProduct({
      name: productForm.name,
      category: productForm.category,
      usage: productForm.usage,
      sellingPoints: productForm.sellingPoints,
      imageUrls: uploadedImages
    });

    // 重置表单
    setProductForm({
      name: '',
      category: '',
      usage: '',
      sellingPoints: ''
    });
    setUploadedImages([]);
    setShowCreateProduct(false);
    
    alert('✅ 商品创建成功！');
  };

  if (!showCreateProduct) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="w-[700px] max-h-[90vh] glass-card flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-white/60 bg-white/90">
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-slate-100 shrink-0 bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-yellow-500/20 text-white">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-800">创建商品</h2>
              <p className="text-xs text-slate-500 mt-1">上传商品图片并填写基础信息</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateProduct(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-6">
            {/* 上传图片区域 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                商品图片 <span className="text-red-500">*</span>
                <span className="text-xs text-slate-500 ml-2">（最多5张）</span>
              </label>
              
              {/* 已上传的图片 */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-5 gap-3 mb-3">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative aspect-square group">
                      <img 
                        src={url} 
                        alt={`商品图片${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border-2 border-slate-200"
                      />
                      <button
                        onClick={() => removeUploadedImage(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 上传按钮 */}
              {uploadedImages.length < 5 && (
                <label className={cn(
                  "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                  isUploading 
                    ? "border-slate-300 bg-slate-50 cursor-not-allowed" 
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-yellow-400"
                )}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                      <>
                        <div className="w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-sm text-slate-500">上传中...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="text-sm text-slate-600">点击上传图片</p>
                        <p className="text-xs text-slate-400 mt-1">支持 JPG、PNG 格式</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>

            {/* 商品信息表单 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  品名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="例如：Muspus口红"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all hover:border-slate-300"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  类目 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 appearance-none focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all hover:border-slate-300"
                  >
                    <option value="">请选择类目</option>
                    <option value="fashion">服装鞋履配饰 (Fashion & Accessories)</option>
                    <option value="beauty">美妆个护 (Beauty & Personal Care)</option>
                    <option value="home">家居生活 (Home & Living)</option>
                    <option value="appliances">家用电器 (Home Appliances)</option>
                    <option value="electronics">电子产品 (Electronics)</option>
                    <option value="computers">电脑及配件 (Computers & Accessories)</option>
                    <option value="digital">数码配件 (Digital Accessories)</option>
                    <option value="sports">运动户外 (Sports & Outdoors)</option>
                    <option value="toys">玩具游戏 (Toys & Games)</option>
                    <option value="baby">母婴用品 (Baby & Kids)</option>
                    <option value="health">健康保健 (Health & Wellness)</option>
                    <option value="pet">宠物用品 (Pet Supplies)</option>
                    <option value="food">食品饮料 (Food & Beverages)</option>
                    <option value="automotive">汽车用品 (Automotive)</option>
                    <option value="office">办公用品 (Office Products)</option>
                    <option value="tools">工具家装 (Tools & Home Improvement)</option>
                    <option value="arts">手工艺术 (Arts & Crafts)</option>
                    <option value="books">图书媒体 (Books & Media)</option>
                    <option value="jewelry">珠宝首饰 (Jewelry)</option>
                    <option value="bags">箱包 (Bags & Luggage)</option>
                    <option value="instruments">乐器 (Musical Instruments)</option>
                    <option value="industrial">工业科学 (Industrial & Scientific)</option>
                    <option value="garden">园艺户外 (Garden & Outdoor)</option>
                    <option value="grocery">杂货 (Grocery)</option>
                    <option value="other">其他 (Other)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                使用方式
              </label>
              <textarea
                value={productForm.usage}
                onChange={(e) => setProductForm({ ...productForm, usage: e.target.value })}
                placeholder="例如：涂抹在嘴唇上，持久不易脱色，滋润保湿"
                rows={3}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all hover:border-slate-300 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                核心卖点
              </label>
              <textarea
                value={productForm.sellingPoints}
                onChange={(e) => setProductForm({ ...productForm, sellingPoints: e.target.value })}
                placeholder="例如：持久显色6-12小时、喝水、进食百不易脱妆、不沾杯、显白适配、低敏和唇膏"
                rows={3}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all hover:border-slate-300 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white/60 backdrop-blur-md flex items-center justify-end gap-3">
          <button
            onClick={() => setShowCreateProduct(false)}
            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!productForm.name || !productForm.category || uploadedImages.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存商品
          </button>
        </div>
      </div>
    </div>
  );
}
