import React, { useRef } from 'react';
import { Upload, Sparkles, Image as ImageIcon, Scan } from 'lucide-react';
import { useFormStore } from '../../lib/store';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

export function ProductInfoForm() {
  const { productInfo, updateProductInfo, recognizeProduct } = useFormStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecognizing, setIsRecognizing] = React.useState(false);

  const handleImageUpload = async (file: File) => {
    try {
      // 上传到服务器
      const response = await api.uploadImage(file);

      // 转换为base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        updateProductInfo({
          productImage: response,
          imageBase64: base64,
        });

        // 自动触发AI识别
        setIsRecognizing(true);
        await recognizeProduct(base64);
        setIsRecognizing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('图片上传失败:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          第一步：产品锚定
        </h2>
        <p className="text-muted-foreground text-sm">
          上传您的产品图片，AI 将自动分析其特征并建立视觉锚点。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Image Upload */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-foreground/80">核心产品图</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative aspect-square rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer group bg-card/30 backdrop-blur-sm overflow-hidden",
              productInfo.productImage ? "border-solid border-primary/20" : ""
            )}
          >
            {productInfo.productImage ? (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <img
                  src={productInfo.productImage}
                  alt="Product"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                  <span className="text-xs text-white bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">点击更换</span>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors gap-3">
                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Upload className="size-7" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium text-foreground">点击上传图片</p>
                  <p className="text-xs opacity-60">支持 JPG, PNG (最大 10MB)</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />

            {/* AI Analyzing Overlay */}
            {isRecognizing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3">
                <Sparkles className="size-8 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary-foreground tracking-wider animate-pulse">AI 正在分析产品特征...</span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground/60 bg-white/5 p-3 rounded-lg border border-white/5">
            <Scan className="size-3.5 mt-0.5 shrink-0" />
            <p>建议上传白底图或纯色背景图，以获得最佳的视觉锚定效果。</p>
          </div>
        </div>

        {/* Right Column: Details Form */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">产品名称</Label>
              <Input
                value={productInfo.productName}
                onChange={(e) => updateProductInfo({ productName: e.target.value })}
                placeholder="例如：极光口红"
                className="bg-white/5 border-white/10 text-foreground h-10 ring-offset-background/0 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">产品类型 (English)</Label>
              <Input
                value={productInfo.productType}
                onChange={(e) => updateProductInfo({ productType: e.target.value })}
                placeholder="e.g. Lipstick"
                className="bg-white/5 border-white/10 text-foreground h-10 ring-offset-background/0 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary/50"
              />
            </div>
          </div>

          {/* AI Extracted Attributes */}
          <div className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="size-3.5 text-primary" />
              <span className="text-sm font-medium text-foreground">AI 提取属性</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">材质</Label>
                <Input
                  value={productInfo.attributes.material}
                  onChange={(e) => updateProductInfo({ attributes: { ...productInfo.attributes, material: e.target.value } })}
                  className="bg-black/20 border-white/5 h-8 text-xs focus:bg-black/40"
                  placeholder="自动识别..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">颜色</Label>
                <Input
                  value={productInfo.attributes.color}
                  onChange={(e) => updateProductInfo({ attributes: { ...productInfo.attributes, color: e.target.value } })}
                  className="bg-black/20 border-white/5 h-8 text-xs focus:bg-black/40"
                  placeholder="自动识别..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">形态</Label>
                <Input
                  value={productInfo.attributes.shape}
                  onChange={(e) => updateProductInfo({ attributes: { ...productInfo.attributes, shape: e.target.value } })}
                  className="bg-black/20 border-white/5 h-8 text-xs focus:bg-black/40"
                  placeholder="自动识别..."
                />
              </div>
            </div>
          </div>

          {/* Size & Scale */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">物理体量</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['mini', 'normal', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateProductInfo({ size })}
                  className={cn(
                    "relative px-3 py-3 rounded-lg border text-xs transition-all duration-200 flex flex-col items-center gap-1.5 overflow-hidden",
                    productInfo.size === size
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_-3px_rgba(139,92,246,0.3)]"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  )}
                >
                  {productInfo.size === size && (
                    <div className="absolute inset-0 bg-primary/5 z-0" />
                  )}
                  <span className="text-base z-10">
                    {size === 'mini' && '💄'}
                    {size === 'normal' && '🥤'}
                    {size === 'large' && '🛋️'}
                  </span>
                  <span className="z-10 font-medium">
                    {size === 'mini' && 'Mini (手持)'}
                    {size === 'normal' && 'Normal (桌面)'}
                    {size === 'large' && 'Large (环境)'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">排除关键词 (Negative Prompt)</Label>
            <Input
              value={productInfo.negativePrompts.join(', ')}
              onChange={(e) => updateProductInfo({ negativePrompts: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              className="bg-white/5 border-white/10 text-foreground/80 h-9 text-xs"
              placeholder="wrong color, distorted, blurry..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
