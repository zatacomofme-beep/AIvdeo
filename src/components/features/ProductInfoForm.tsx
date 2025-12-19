import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';

interface ProductInfo {
  productName: string;
  size: string;
  weight: string;
  sellingPoints: string;
  targetMarket: string;
  ageGroup: string;
  gender: string;
  style: string;
}

interface ProductInfoFormProps {
  onSubmit: (info: ProductInfo) => void;
  isGenerating: boolean;
}

export function ProductInfoForm({ onSubmit, isGenerating }: ProductInfoFormProps) {
  const [formData, setFormData] = useState<ProductInfo>({
    productName: '',
    size: '',
    weight: '',
    sellingPoints: '',
    targetMarket: '',
    ageGroup: '',
    gender: '',
    style: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof ProductInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-[#1E1E22] rounded-lg border border-[#2A2A2E]">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-cyan-400" size={20} />
        <h3 className="text-lg font-bold text-white">产品信息</h3>
      </div>

      {/* 基础信息 */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="productName" className="text-sm text-gray-300">商品名称 *</Label>
          <Input
            id="productName"
            value={formData.productName}
            onChange={(e) => updateField('productName', e.target.value)}
            placeholder="例如：玫瑰精华口红"
            required
            className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="size" className="text-sm text-gray-300">尺寸规格</Label>
            <Input
              id="size"
              value={formData.size}
              onChange={(e) => updateField('size', e.target.value)}
              placeholder="例如：3.5g / 10cm"
              className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
            />
          </div>
          <div>
            <Label htmlFor="weight" className="text-sm text-gray-300">重量</Label>
            <Input
              id="weight"
              value={formData.weight}
              onChange={(e) => updateField('weight', e.target.value)}
              placeholder="例如：15g"
              className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="sellingPoints" className="text-sm text-gray-300">核心卖点 *</Label>
          <Textarea
            id="sellingPoints"
            value={formData.sellingPoints}
            onChange={(e) => updateField('sellingPoints', e.target.value)}
            placeholder="例如：持久不掉色、天然成分、滋润保湿"
            required
            rows={3}
            className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white resize-none"
          />
        </div>
      </div>

      {/* 目标用户 */}
      <div className="space-y-4 pt-4 border-t border-[#2A2A2E]">
        <h4 className="text-sm font-semibold text-gray-300">目标用户</h4>
        
        <div>
          <Label htmlFor="targetMarket" className="text-sm text-gray-300">目标市场 *</Label>
          <Input
            id="targetMarket"
            value={formData.targetMarket}
            onChange={(e) => updateField('targetMarket', e.target.value)}
            placeholder="例如：中国、印尼、越南、泰国"
            required
            className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ageGroup" className="text-sm text-gray-300">年龄段 *</Label>
            <Input
              id="ageGroup"
              value={formData.ageGroup}
              onChange={(e) => updateField('ageGroup', e.target.value)}
              placeholder="例如：GenZ、Millennial"
              required
              className="bg-[#0A0A0C] border-[#2A2A2E] text-white"
            />
          </div>

          <div>
            <Label htmlFor="gender" className="text-sm text-gray-300">性别 *</Label>
            <Input
              id="gender"
              value={formData.gender}
              onChange={(e) => updateField('gender', e.target.value)}
              placeholder="例如：女性、男性、不限"
              required
              className="bg-[#0A0A0C] border-[#2A2A2E] text-white"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="style" className="text-sm text-gray-300">视频风格 *</Label>
          <Input
            id="style"
            value={formData.style}
            onChange={(e) => updateField('style', e.target.value)}
            placeholder="例如：真实、精致、潮流、简约"
            required
            className="mt-1.5 bg-[#0A0A0C] border-[#2A2A2E] text-white"
          />
        </div>
      </div>

      {/* 提交按钮 */}
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#6A5ACD] hover:from-[#7B1FA2] hover:to-[#5B4BBD]"
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            AI 生成脚本中...
          </>
        ) : (
          <>
            <Sparkles size={16} className="mr-2" />
            AI 一键生成脚本
          </>
        )}
      </Button>
    </form>
  );
}
