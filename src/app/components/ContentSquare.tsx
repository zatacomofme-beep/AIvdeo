import React, { useEffect, useState } from 'react';
import { Heart, Play, User, Search, Filter, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const API_BASE_URL = 'http://115.190.137.87:8000';

interface PublicVideo {
  id: string;
  title: string;
  author: string;
  likes: number;
  views: number;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  createdAt: number;
}

export function ContentSquare() {
  const [contents, setContents] = useState<PublicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 获取公开视频
  useEffect(() => {
    fetchPublicVideos();
  }, []);

  const fetchPublicVideos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public-videos`);
      if (!response.ok) throw new Error('获取视频失败');
      const data = await response.json();
      setContents(data.videos || []);
    } catch (error) {
      console.error('获取公开视频失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContents = contents.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">内容广场</h2>
          <p className="text-slate-500">探索社区中最受欢迎的 AI 生成视频作品</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="搜索作品..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all w-64 shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Tags/Categories */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {['全部推荐', '电商广告', '产品展示', '虚拟模特', '场景漫游', '特效合成', '短剧', '教育培训'].map((tag, index) => (
          <button
            key={tag}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              index === 0
                ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                : "bg-white border border-slate-200 text-slate-600 hover:border-cyan-200 hover:text-cyan-600 hover:bg-cyan-50"
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-cyan-500" size={40} />
          <span className="ml-3 text-slate-500">加载中...</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContents.map((item) => (
          <div key={item.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
            {/* Thumbnail */}
            <div className="aspect-[16/9] relative overflow-hidden bg-slate-100">
              <img 
                src={item.thumbnail} 
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <button className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all border border-white/30">
                  <Play fill="currentColor" size={20} className="ml-1" />
                </button>
              </div>
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-white font-medium">
                {item.duration}
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1 group-hover:text-cyan-600 transition-colors">
                {item.title}
              </h3>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-6 h-6 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-bold text-[10px]">
                    {item.author.charAt(0)}
                  </div>
                  <span className="truncate max-w-[80px]">{item.author}</span>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Heart size={12} className="group-hover:text-pink-500 transition-colors" />
                    <span>{item.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
