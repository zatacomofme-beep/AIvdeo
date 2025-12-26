import React, { useState, useEffect } from 'react';
import { Heart, Play, User, Search, Filter, Loader2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const API_BASE_URL = 'https://semopic.com';

interface PublicVideo {
  id: string;
  productName: string;  // 后端返回的是productName
  url: string;  // 后端返回的是url
  thumbnail: string;
  script: string;
  status: string;
  isPublic: boolean;
  createdAt: number;
  category?: string;  // 新增：商品类目
}

// 商品类目定义（与CreateProductPanel保持一致）
const CATEGORIES = [
  { value: 'all', label: '全部推荐' },
  { value: 'home', label: '家居生活' },
  { value: 'fashion', label: '服装鞋履配饰' },
  { value: 'beauty', label: '美妆个护' },
  { value: 'appliances', label: '家用电器' },
  { value: 'electronics', label: '电子产品' },
  { value: 'computers', label: '电脑及配件' },
  { value: 'digital', label: '数码配件' },
  { value: 'sports', label: '运动户外' },
  { value: 'toys', label: '玩具游戏' },
  { value: 'baby', label: '母婴用品' },
  { value: 'health', label: '健康保健' },
  { value: 'pet', label: '宠物用品' },
  { value: 'food', label: '食品饮料' },
  { value: 'automotive', label: '汽车用品' },
  { value: 'office', label: '办公用品' },
  { value: 'tools', label: '工具家装' },
  { value: 'arts', label: '手工艺术' },
  { value: 'books', label: '图书媒体' },
  { value: 'jewelry', label: '珠宝首饰' },
  { value: 'bags', label: '箱包' },
  { value: 'music', label: '乐器' },
  { value: 'industrial', label: '工业科学' },
  { value: 'garden', label: '园艺户外' },
  { value: 'grocery', label: '杂货' },
  { value: 'other', label: '其他' },
];

export function ContentSquare() {
  const [contents, setContents] = useState<PublicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);  // 新增：当前播放的视频ID
  const [selectedCategory, setSelectedCategory] = useState('all');  // 新增：选中的类目

  // 获取公开视频
  useEffect(() => {
    fetchPublicVideos();
  }, []);

  const fetchPublicVideos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public-videos`);
      if (!response.ok) throw new Error('获取视频失败');
      const data = await response.json();
      console.log('内容广场数据:', data);
      setContents(data.videos || []);
    } catch (error) {
      console.error('获取公开视频失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContents = contents.filter(item => {
    // 类目筛选
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    // 搜索筛选
    const matchSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // 新增：播放视频
  const handlePlayVideo = (videoId: string) => {
    setPlayingVideo(videoId);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900 mb-2">内容广场</h2>
          <p className="text-slate-600">探索社区中最受欢迎的 AI 生成视频作品</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="搜索作品..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-tech focus:ring-2 focus:ring-tech/20 transition-all w-64"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Tags/Categories */}
      <div className="flex flex-wrap gap-3 mb-8">
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all",
              selectedCategory === category.value
                ? "bg-tech text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-tech/50 hover:text-tech hover:bg-tech-light/10"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-tech" size={40} />
          <span className="ml-3 text-slate-500">加载�?..</span>
        </div>
      ) : filteredContents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Play size={40} className="text-slate-300" />
          </div>
          <p className="text-lg">暂无公开视频</p>
          <p className="text-sm mt-2">管理员尚未审核通过任何作品</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredContents.map((item) => (
          <div key={item.id} className="tech-card group overflow-hidden hover:shadow-tech-md transition-all">
            {/* Thumbnail */}
            <div className="aspect-[9/16] relative overflow-hidden bg-slate-100">
              <img 
                src={item.thumbnail} 
                alt={item.productName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <button 
                  onClick={() => handlePlayVideo(item.id)}
                  className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all border border-white/30"
                >
                  <Play fill="currentColor" size={20} className="ml-1" />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-tech transition-colors">
                {item.productName}
              </h3>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-[10px]">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
      
      {/* 视频播放弹窗 */}
      {playingVideo && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div 
            className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-colors"
            >
              <XCircle size={24} />
            </button>
            <video
              src={contents.find(v => v.id === playingVideo)?.url}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
