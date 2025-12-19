import { useFormStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Video, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function NewProductUploadForm() {
  const { productInfo, updateProductInfo, submitProductInfo, isGenerating, currentStep } = useFormStore();
  const [uploading, setUploading] = useState(false);
  const [usageMediaType, setUsageMediaType] = useState<'video' | 'images' | 'text' | null>(null);

  // 上传商品图片（最多5张）
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 检查总数量
    if (productInfo.productImages.length + files.length > 5) {
      alert('最多只能上传5张商品图片');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => api.uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      
      // 读取base64
      const base64Promises = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      const base64Array = await Promise.all(base64Promises);

      updateProductInfo({
        productImages: [...productInfo.productImages, ...urls],
        imagesBase64: [...productInfo.imagesBase64, ...base64Array],
      });
    } catch (error) {
      console.error('上传失败:', error);
      alert('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 删除某张商品图片
  const removeProductImage = (index: number) => {
    const newImages = productInfo.productImages.filter((_, i) => i !== index);
    const newBase64 = productInfo.imagesBase64.filter((_, i) => i !== index);
    updateProductInfo({
      productImages: newImages,
      imagesBase64: newBase64,
    });
  };

  // 上传使用方法视频
  const handleUsageVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await api.uploadImage(file);  // 后端需要支持视频上传
      updateProductInfo({
        usageMedia: {
          type: 'video',
          videoUrl: url,
        },
      });
      setUsageMediaType('video');
    } catch (error) {
      console.error('视频上传失败:', error);
      alert('视频上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 上传使用方法图片
  const handleUsageImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => api.uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      
      updateProductInfo({
        usageMedia: {
          type: 'images',
          imageUrls: [...(productInfo.usageMedia.imageUrls || []), ...urls],
        },
      });
      setUsageMediaType('images');
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 标题区域 */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
          <Upload className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">商品信息上传</h2>
      </div>

      {/* 商品图片上传（5张）*/}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          商品图片（必须5张）
        </Label>
        
        {/* 已上传的图片网格 */}
        {productInfo.productImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {productInfo.productImages.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                <img src={url} alt={`商品${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeProductImage(index)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}/5
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 上传按钮 */}
        {productInfo.productImages.length < 5 && (
          <label className={cn(
            "flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed cursor-pointer transition-all",
            uploading 
              ? "border-gray-300 bg-gray-50 cursor-not-allowed" 
              : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50"
          )}>
            <Upload className={cn("w-6 h-6 mb-1", uploading ? "text-gray-400" : "text-gray-500")} />
            <span className="text-xs text-gray-600">
              {uploading ? '上传中...' : `还需上传 ${5 - productInfo.productImages.length} 张图片`}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleProductImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* 商品名称 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">商品名称</Label>
        <Input
          value={productInfo.productName}
          onChange={(e) => updateProductInfo({ productName: e.target.value })}
          placeholder="例如：无线蓝牙耳机"
          className="h-9 text-sm"
        />
      </div>

      {/* 使用方法上传 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          使用方法说明（选择一种方式）
        </Label>

        {/* 选择上传方式 */}
        {!usageMediaType && (
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all">
              <Video className="w-5 h-5 text-gray-500 mb-1" />
              <span className="text-xs text-gray-600">上传视频</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleUsageVideoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

            <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all">
              <ImageIcon className="w-5 h-5 text-gray-500 mb-1" />
              <span className="text-xs text-gray-600">上传图文</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUsageImagesUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                setUsageMediaType('text');
                updateProductInfo({
                  usageMedia: { type: 'text', textDescription: '' },
                });
              }}
              className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
            >
              <FileText className="w-5 h-5 text-gray-500 mb-1" />
              <span className="text-xs text-gray-600">文字描述</span>
            </button>
          </div>
        )}

        {/* 显示已上传的内容 */}
        {usageMediaType === 'video' && productInfo.usageMedia.videoUrl && (
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <video src={productInfo.usageMedia.videoUrl} controls className="w-full" />
            <button
              onClick={() => {
                setUsageMediaType(null);
                updateProductInfo({ usageMedia: { type: null } });
              }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {usageMediaType === 'images' && productInfo.usageMedia.imageUrls && productInfo.usageMedia.imageUrls.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {productInfo.usageMedia.imageUrls.map((url, index) => (
                <img key={index} src={url} alt={`使用方法${index + 1}`} className="w-full rounded-lg border border-gray-200" />
              ))}
            </div>
            <button
              onClick={() => {
                setUsageMediaType(null);
                updateProductInfo({ usageMedia: { type: null } });
              }}
              className="text-xs text-red-500 hover:underline"
            >
              重新选择
            </button>
          </div>
        )}

        {usageMediaType === 'text' && (
          <div className="space-y-2">
            <Textarea
              value={productInfo.usageMedia.textDescription || ''}
              onChange={(e) => updateProductInfo({
                usageMedia: {
                  ...productInfo.usageMedia,
                  textDescription: e.target.value,
                },
              })}
              placeholder="请详细描述商品的使用方法、使用场景等..."
              className="min-h-24 text-sm"
            />
            <button
              onClick={() => {
                setUsageMediaType(null);
                updateProductInfo({ usageMedia: { type: null } });
              }}
              className="text-xs text-red-500 hover:underline"
            >
              重新选择
            </button>
          </div>
        )}
      </div>

      {/* 提交按钮 */}
      <Button
        onClick={submitProductInfo}
        disabled={
          productInfo.productImages.length !== 5 ||
          !productInfo.productName ||
          !productInfo.usageMedia.type ||
          isGenerating ||
          currentStep !== 'upload'
        }
        className="w-full h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium"
      >
        {isGenerating ? (
          <>
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
            AI正在生成脚本...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            提交并生成脚本
          </>
        )}
      </Button>

      {/* 步骤提示 */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
        <p>📌 完成上传后，系统将自动：</p>
        <p className="pl-4">1. 分析商品特征和使用方法</p>
        <p className="pl-4">2. 生成视频脚本</p>
        <p className="pl-4">3. 准备视频生成素材</p>
      </div>
    </div>
  );
}
