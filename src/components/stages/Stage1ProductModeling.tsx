import React, { useState } from 'react';
import { useFormStore } from '../../lib/store';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Upload, X, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function Stage1ProductModeling() {
  const { productInfo, updateProductInfo, saveProduct, savedProducts, loadProduct, deleteProduct } = useFormStore();
  const [newSellingPoint, setNewSellingPoint] = useState('');
  const [showSavedProducts, setShowSavedProducts] = useState(false);

  // 处理图片上传
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const currentCount = productInfo.productImages.length;
    const remainingSlots = 5 - currentCount;

    if (remainingSlots === 0) {
      toast.error('已达到5张图片上限');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const newImages: string[] = [];
    const newBase64: string[] = [];

    for (const file of filesToUpload) {
      // 读取为base64
      const base64 = await fileToBase64(file);
      newBase64.push(base64);

      // 上传到TOS
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('http://localhost:8000/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('上传失败');
        }

        const data = await response.json();
        newImages.push(data.url);
        toast.success(`成功上传 ${file.name}`);
      } catch (error) {
        console.error('上传图片失败:', error);
        toast.error(`上传 ${file.name} 失败`);
      }
    }

    updateProductInfo({
      productImages: [...productInfo.productImages, ...newImages],
      imagesBase64: [...productInfo.imagesBase64, ...newBase64],
    });
  };

  // 文件转base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // 删除图片
  const removeImage = (index: number) => {
    const newImages = productInfo.productImages.filter((_, i) => i !== index);
    const newBase64 = productInfo.imagesBase64.filter((_, i) => i !== index);
    updateProductInfo({ productImages: newImages, imagesBase64: newBase64 });
  };

  // 添加卖点
  const addSellingPoint = () => {
    if (!newSellingPoint.trim()) {
      toast.error('请输入卖点内容');
      return;
    }
    updateProductInfo({
      sellingPoints: [...productInfo.sellingPoints, newSellingPoint.trim()],
    });
    setNewSellingPoint('');
  };

  // 删除卖点
  const removeSellingPoint = (index: number) => {
    const newPoints = productInfo.sellingPoints.filter((_, i) => i !== index);
    updateProductInfo({ sellingPoints: newPoints });
  };

  // 保存产品
  const handleSaveProduct = async () => {
    await saveProduct();
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      {/* 大标题 */}
      <div className="text-center py-16 px-6">
        <h1 className="text-5xl font-bold mb-4">Transform your products into stunning visuals</h1>
        <p className="text-gray-400 text-lg">Upload 5 high-quality images and build your product profile</p>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-16 space-y-8">
        {/* 多图上传区域 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-white">
              Product Images ({productInfo.productImages.length}/5)
            </Label>
            <span className="text-sm text-gray-500">5 images required</span>
          </div>

          {/* 图片网格 */}
          <div className="grid grid-cols-5 gap-4">
            {productInfo.productImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-2xl border-2 border-gray-800 hover:border-yellow-400 overflow-hidden group transition-all"
              >
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/80 text-white text-xs rounded-full font-medium">
                  {index + 1}
                </div>
              </div>
            ))}

            {/* 上传按钮 */}
            {productInfo.productImages.length < 5 && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-700 hover:border-yellow-400 cursor-pointer transition-all flex flex-col items-center justify-center bg-[#141414] hover:bg-[#1a1a1a] group">
                <Upload className="w-8 h-8 text-gray-600 group-hover:text-yellow-400 transition-colors" />
                <span className="text-sm text-gray-500 mt-2 group-hover:text-gray-300">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
              </label>
            )}
          </div>
        </div>

        {/* 结构化表单 */}
        <div className="bg-[#141414] rounded-2xl border border-gray-800 p-8 space-y-6">
          <h3 className="text-xl font-semibold text-white">Product Information</h3>

          {/* 商品名称 */}
          <div className="space-y-2">
            <Label htmlFor="productName" className="text-sm text-gray-400">Product Name *</Label>
            <Input
              id="productName"
              placeholder="e.g., Lancome Advanced Genifique Serum"
              value={productInfo.productName}
              onChange={(e) => updateProductInfo({ productName: e.target.value })}
              className="bg-[#0a0a0a] border-gray-800 text-white placeholder:text-gray-600 focus:border-yellow-400 rounded-xl h-12"
            />
          </div>

          {/* 品牌名称 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="brandName" className="text-sm text-gray-400">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="e.g., Lancome"
                value={productInfo.brandName || ''}
                onChange={(e) => updateProductInfo({ brandName: e.target.value })}
                className="bg-[#0a0a0a] border-gray-800 text-white placeholder:text-gray-600 focus:border-yellow-400 rounded-xl h-12"
              />
            </div>

            {/* 品类 */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm text-gray-400">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Serum"
                value={productInfo.category || ''}
                onChange={(e) => updateProductInfo({ category: e.target.value })}
                className="bg-[#0a0a0a] border-gray-800 text-white placeholder:text-gray-600 focus:border-yellow-400 rounded-xl h-12"
              />
            </div>
          </div>

          {/* 使用方式 */}
          <div className="space-y-2">
            <Label htmlFor="usageMethod" className="text-sm text-gray-400">Usage Method *</Label>
            <Textarea
              id="usageMethod"
              placeholder="Describe how the product should be used in the video (e.g., spray, apply, wear)"
              value={productInfo.usageMethod}
              onChange={(e) => updateProductInfo({ usageMethod: e.target.value })}
              rows={3}
              className="bg-[#0a0a0a] border-gray-800 text-white placeholder:text-gray-600 focus:border-yellow-400 rounded-xl resize-none"
            />
          </div>

          {/* 核心卖点 */}
          <div className="space-y-3">
            <Label className="text-sm text-gray-400">Key Selling Points * (AI will use these)</Label>
            
            {/* 已添加的卖点 */}
            <div className="space-y-2">
              {productInfo.sellingPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-[#0a0a0a] rounded-xl border border-gray-800 hover:border-yellow-400/50 transition-colors"
                >
                  <span className="flex-1 text-sm text-gray-200">{point}</span>
                  <button
                    onClick={() => removeSellingPoint(index)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>

            {/* 添加新卖点 */}
            <div className="flex gap-3">
              <Input
                placeholder="Add a key selling point (e.g., Anti-aging, Brightening)"
                value={newSellingPoint}
                onChange={(e) => setNewSellingPoint(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSellingPoint();
                  }
                }}
                className="bg-[#0a0a0a] border-gray-800 text-white placeholder:text-gray-600 focus:border-yellow-400 rounded-xl h-12"
              />
              <Button onClick={addSellingPoint} className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl px-6 h-12">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-center pt-8">
          <Button
            size="lg"
            onClick={() => useFormStore.getState().nextStage()}
            disabled={
              productInfo.productImages.length !== 5 ||
              !productInfo.productName ||
              !productInfo.usageMethod ||
              productInfo.sellingPoints.length === 0
            }
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-xl px-12 h-14 text-lg shadow-lg shadow-yellow-400/30 disabled:bg-gray-800 disabled:text-gray-600 disabled:shadow-none"
          >
            Continue to Director Settings →
          </Button>
        </div>
      </div>
    </div>
  );
}
