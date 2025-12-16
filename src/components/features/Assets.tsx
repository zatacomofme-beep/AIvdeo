import React from 'react';
import { Play, Download, Trash2, Clock, CheckCircle2 } from 'lucide-react';

export function Assets() {
  // TODO: 从后端加载实际作品数据
  const assets: any[] = [];

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#09090b] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">我的作品</h2>
            <p className="text-zinc-400 text-sm">管理您生成的视频和图像资产。</p>
          </div>
          <div className="flex gap-2">
             <select className="bg-[#18181b] border border-[#2A2A2E] text-sm rounded-md px-3 py-2 text-white focus:outline-none">
               <option>全部类型</option>
               <option>视频</option>
               <option>图像</option>
             </select>
          </div>
        </div>
        
        {assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="w-24 h-24 rounded-full bg-[#18181b] flex items-center justify-center mb-4">
              <Play size={40} className="text-zinc-600" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">还没有作品</h3>
            <p className="text-zinc-500 text-sm">开始生成您的第一个视频吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {assets.map((asset) => (
            <div key={asset.id} className="group relative aspect-[9/16] bg-[#18181b] rounded-xl overflow-hidden border border-[#2A2A2E] hover:border-[#8A2BE2] transition-all cursor-pointer shadow-lg shadow-black/20">
              <img src={asset.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Asset" />
              
              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                {asset.status === 'processing' ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium bg-black/60 backdrop-blur-md px-2 py-1 rounded text-yellow-400 border border-yellow-500/20">
                    <Clock size={10} /> 生成中
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-medium bg-black/60 backdrop-blur-md px-2 py-1 rounded text-green-400 border border-green-500/20">
                    <CheckCircle2 size={10} /> 完成
                  </span>
                )}
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                 <div className="flex items-center justify-between">
                    {asset.type === 'video' ? (
                      <span className="text-[10px] font-mono text-zinc-300">
                        {asset.duration}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-300">
                        IMG
                      </span>
                    )}
                    <div className="flex gap-2">
                       <button className="p-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-full transition-colors backdrop-blur-sm">
                          <Download size={14} />
                       </button>
                    </div>
                 </div>
                 <p className="text-[10px] text-zinc-500 mt-2">{asset.date}</p>
              </div>
              
              {asset.type === 'video' && asset.status === 'completed' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-12 h-12 rounded-full bg-[#8A2BE2]/80 backdrop-blur-sm flex items-center justify-center shadow-[0_0_20px_rgba(138,43,226,0.5)]">
                      <Play size={20} fill="white" className="text-white ml-1" />
                   </div>
                </div>
              )}
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
