
import React, { useState } from 'react';
import { Upload, ImagePlus, Sparkles, Trash2, Download, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { useStore } from '../lib/store';
import { useToast } from './ui/toast';
import { cn } from '../lib/utils';

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

export function NineGridGenerator() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, isLoggedIn, setCredits } = useStore();
  const toast = useToast();

  // 加载用户的九宫格图片列表
  React.useEffect(() => {
    if (isLoggedIn && user) {
      loadGeneratedImages();
    }
  }, [isLoggedIn, user]);

  const loadGeneratedImages = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await api.getGeneratedImages(user.id);
      setGeneratedImages(response.images);
    } catch (error) {
      console.error('加载图片列表失败:', error);
      toast.error('加载失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('文件类型错误', '请上传图片文件');
      return;
    }

    // 验证文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件过大', '请上传小于10MB的图片');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleGenerate = async () => {
    if (!isLoggedIn || !user) {
      toast.error('请先登录', '生成九宫格图片需要登录');
      return;
    }

    if (!selectedFile) {
      toast.error('请选择图片', '请先上传一张白底商品图');
      return;
    }

    setIsGenerating(true);
    try {
      // 1. 上传图片到服务器
      toast.info('上传中...', '正在上传图片到服务器');
      const imageUrl = await api.uploadImage(selectedFile);
      
      // 2. 调用九宫格生成API
      toast.info('生成中...', '正在生成九宫格图片，请稍候（约30-60秒）');
      const result = await api.generateNineGrid(imageUrl, user.id);
      
      // 3. 更新积分
      setCredits(result.credits);
      
      // 4. 刷新图片列表
      await loadGeneratedImages();
      
      // 5. 清空选择
      setSelectedFile(null);
      setPreviewUrl('');
      
      toast.success('生成成功', result.message);
    } catch (error) {
      console.error('生成九宫格失败:', error);
      toast.error('生成失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!user) return;
    
    if (!confirm('确定要删除这张图片吗？')) return;
    
    try {
      await api.deleteGeneratedImage(imageId, user.id);
      await loadGeneratedImages();
      toast.success('删除成功', '图片已从库中删除');
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败', error instanceof Error ? error.message : '请稍后重试');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ImagePlus size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">请先登录</h3>
          <p className="text-slate-500">登录后即可使用九宫格生成功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Header with Modern Design */}
      <div className="relative px-8 py-8 border-b border-white/30 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 backdrop-blur-md">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="relative">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            🎨 九宫格生成器
          </h1>
          <p className="text-lg text-slate-700 font-medium">上传白底商品图，AI生成9个不同角度的2K高清九宫格展示图</p>
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full border border-yellow-200/50">
              <Sparkles size={16} className="text-yellow-600" />
              <span className="font-bold text-yellow-700">消耗 50 积分/张</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full border border-blue-200/50">
              <Clock size={16} className="text-blue-600" />
              <span className="font-bold text-blue-700">生成时间约 30-60 秒</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Upload Section with Glass Effect */}
          <div className="relative bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl rounded-3xl border-2 border-white/60 p-10 mb-10 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
            <h2 className="relative text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">📷</span>
              上传白底商品图
            </h2>
            
            <div className="relative grid grid-cols-2 gap-10">
              {/* Upload Area with Modern Design */}
              <div>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className={cn(
                    "border-3 border-dashed rounded-2xl p-10 cursor-pointer transition-all relative overflow-hidden group",
                    previewUrl 
                      ? "border-cyan-400 bg-gradient-to-br from-cyan-50/80 to-blue-50/80 shadow-lg shadow-cyan-500/20" 
                      : "border-slate-300 hover:border-purple-400 bg-gradient-to-br from-slate-50/80 to-white/80 hover:shadow-lg hover:shadow-purple-500/10"
                  )}>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                    {previewUrl ? (
                      <div className="relative space-y-4">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full h-72 object-contain rounded-xl bg-white shadow-md"
                        />
                        <p className="text-sm font-bold text-cyan-700 text-center truncate">
                          {selectedFile?.name}
                        </p>
                      </div>
                    ) : (
                      <div className="relative text-center space-y-4">
                        <Upload size={48} className="mx-auto text-slate-400" />
                        <div>
                          <p className="text-slate-600 font-medium mb-1">点击或拖拽上传图片</p>
                          <p className="text-sm text-slate-500">支持 JPG、PNG 格式，最大 10MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!selectedFile || isGenerating}
                  className={cn(
                    "w-full mt-4 px-6 py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2",
                    !selectedFile || isGenerating
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/30"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>生成中...（约30-60秒）</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>生成九宫格 (50积分)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tips */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📸 最佳图片要求</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 白色或浅色简洁背景</li>
                    <li>• 商品居中放置，占比适中</li>
                    <li>• 图片清晰，光线均匀</li>
                    <li>• 避免复杂背景和阴影</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✨ 生成效果</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• 3×3 网格布局，共9个视角</li>
                    <li>• 2K高清分辨率（1920×1920）</li>
                    <li>• 自动生成多角度展示</li>
                    <li>• 保持产品材质和光照一致</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-2">💡 使用提示</h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• 生成后可在商品创建时选用</li>
                    <li>• 图片永久保存在图片库</li>
                    <li>• 每次生成消耗50积分</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Images Grid */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              我的九宫格图片库 ({generatedImages.length})
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
              </div>
            ) : generatedImages.length === 0 ? (
              <div className="text-center py-12">
                <ImagePlus size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">还没有生成九宫格图片</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {generatedImages.map((image) => (
                  <div 
                    key={image.id}
                    className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-slate-100 relative overflow-hidden">
                      <img 
                        src={image.gridUrl} 
                        alt="九宫格图片"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a
                          href={image.gridUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white rounded-lg hover:bg-slate-100 transition-colors"
                          title="查看大图"
                        >
                          <Download size={20} className="text-slate-700" />
                        </a>
                        <button
                          onClick={() => handleDelete(image.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{formatDate(image.createdAt)}</span>
                        <span className="text-amber-600 font-semibold">{image.creditsCost}积分</span>
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        ID: {image.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
