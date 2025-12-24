import React, { useState, useEffect } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, Trash2, Images, Check } from 'lucide-react';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';
import { api, API_BASE_URL } from '../../lib/api';

// 定义九宫格图片类型
interface GeneratedImage {
  id: string;
  gridUrl: string;
  originalUrl: string;
  modelName: string;
  creditsCost: number;
  createdAt: number;
  tags?: string[];
  category?: string;
}

export function CreateProductPanel() {
  const { 
    showCreateProduct, 
    setShowCreateProduct,
    saveProduct,
    uploadedImages,
    setUploadedImages,
    addUploadedImage,
    removeUploadedImage,
    user,
    isLoggedIn
  } = useStore();

  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    usage: '',
    sellingPoints: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  
  // 新增：图库相关状态
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GeneratedImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [selectedGalleryImageId, setSelectedGalleryImageId] = useState<string | null>(null);

  // 加载图库图片
  useEffect(() => {
    if (showCreateProduct && isLoggedIn && user) {
      loadGalleryImages();
    }
  }, [showCreateProduct, isLoggedIn, user]);

  const loadGalleryImages = async () => {
    if (!user) return;
    
    setIsLoadingGallery(true);
    try {
      const response = await api.getGeneratedImages(user.id);
      setGalleryImages(response.images);
    } catch (error) {
      console.error('加载图库失败:', error);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  // 从图库选择图片
  const handleSelectFromGallery = (image: GeneratedImage) => {
    // 清空已上传的图片，使用图库图片
    setUploadedImages([image.gridUrl]);
    setSelectedGalleryImageId(image.id);
    setShowGallery(false);
    console.log('✅ 已选择图库图片:', image.gridUrl);
  };

  // 格式化时间
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 图片压缩功能
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('无法创建 Canvas 上下文'));
            return;
          }
          
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'));
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              console.log(`✅ 图片压缩成功: ${file.name}`);
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8
          );
        };
        
        img.onerror = () => reject(new Error('图片加载失败'));
      };
      
      reader.onerror = () => reject(new Error('文件读取失败'));
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 9) {
      alert('最多只能上传9张图片');
      e.target.value = '';
      return;
    }

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedFile = await compressImage(file);
        const url = await api.uploadImage(compressedFile);
        addUploadedImage(url);
      }
      
      console.log('✅ 图片上传成功');
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('❌ 图片上传失败，请重试');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!productForm.name || !productForm.category) {
      alert('请填写必填项：品名和类目');
      return;
    }

    if (uploadedImages.length === 0) {
      alert('请至少上传1张商品图片');
      return;
    }

    try {
      await saveProduct({
        name: productForm.name,
        category: productForm.category,
        usage: productForm.usage,
        sellingPoints: productForm.sellingPoints,
        imageUrls: uploadedImages
      });

      setProductForm({
        name: '',
        category: '',
        usage: '',
        sellingPoints: ''
      });
      setUploadedImages([]);
      setShowCreateProduct(false);
      
      console.log('✅ 商品创建成功');
    } catch (error) {
      console.error('保存商品失败:', error);
    }
  };

  if (!showCreateProduct) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="w-[1100px] max-h-[90vh] glass-card flex shadow-2xl rounded-2xl overflow-hidden border border-white/60 bg-white/90">
        {/* 左侧：上传区域 + 表单 */}
        <div className="flex-1 flex flex-col">
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
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    商品图片 <span className="text-red-500">*</span>
                    <span className="text-xs text-purple-600 ml-2 font-semibold">上传新图或从图库选择</span>
                  </label>
                  {/* 打开图库按钮 */}
                  {isLoggedIn && galleryImages.length > 0 && (
                    <button
                      onClick={() => setShowGallery(!showGallery)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                        showGallery
                          ? "text-cyan-700 bg-cyan-100 border-2 border-cyan-400"
                          : "text-cyan-600 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100"
                      )}
                    >
                      <Images size={14} />
                      从图库选择 ({galleryImages.length})
                    </button>
                  )}
                </div>
              
                {/* 提示信息 */}
                {uploadedImages.length > 0 && uploadedImages.length < 9 && (
                  <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-xs text-purple-700">
                      ✨ 已选择 {uploadedImages.length} 张商品图片
                    </p>
                  </div>
                )}
              
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
                {uploadedImages.length < 9 && (
                  <label className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                    isUploading 
                      ? "border-slate-300 bg-slate-50 cursor-not-allowed" 
                      : "border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400"
                  )}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <>
                          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <p className="text-sm text-slate-500">上传中...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2 text-purple-500" />
                          <p className="text-sm text-slate-700 font-medium">点击上传新图片</p>
                          <p className="text-xs text-purple-600 mt-1">支持多张图片上传，最多9张</p>
                          <p className="text-xs text-slate-400 mt-0.5">支持 JPG、PNG 格式</p>
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
                      <option value="electronics">电子产品 (Electronics)</option>
                      <option value="sports">运动户外 (Sports & Outdoors)</option>
                      <option value="food">食品饮料 (Food & Beverages)</option>
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
                  placeholder="例如：持久显色6-12小时、喝水、进食百不易脱妆、不沾杯、显白适配"
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

        {/* 右侧：图库面板 */}
        {showGallery && (
          <div className="w-[400px] border-l border-slate-200 flex flex-col bg-white/80">
            {/* 图库Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <Images size={20} className="text-cyan-600" />
                <div>
                  <h3 className="font-semibold text-slate-800">我的九宫格图库</h3>
                  <p className="text-xs text-slate-500">点击选择作为商品图</p>
                </div>
              </div>
              <button
                onClick={() => setShowGallery(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* 图库内容 */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isLoadingGallery ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="text-center py-12">
                  <Images size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 text-sm">还没有九宫格图片</p>
                  <p className="text-slate-400 text-xs mt-2">前往"九宫格生成"创建</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {galleryImages.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => handleSelectFromGallery(image)}
                      className={cn(
                        "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                        selectedGalleryImageId === image.id
                          ? "border-cyan-500 ring-2 ring-cyan-200"
                          : "border-slate-200 hover:border-cyan-300"
                      )}
                    >
                      {/* 图片 */}
                      <div className="aspect-square bg-slate-100 relative">
                        <img 
                          src={image.gridUrl} 
                          alt="九宫格图片"
                          className="w-full h-full object-cover"
                        />
                        
                        {/* 悬浮遮罩 */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center">
                            <Check size={24} className="mx-auto mb-1" />
                            <p className="text-xs font-medium">选择此图</p>
                          </div>
                        </div>

                        {/* 选中标记 */}
                        {selectedGalleryImageId === image.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                      </div>

                      {/* 信息 */}
                      <div className="p-2 bg-white">
                        <p className="text-xs text-slate-500 text-center">{formatDate(image.createdAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
