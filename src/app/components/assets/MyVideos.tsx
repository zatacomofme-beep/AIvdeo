import React, { useEffect } from 'react';
import { Play, Download, Trash2, Clock, Film, Loader2, CheckCircle2, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

export function MyVideos() {
  const { myVideos, deleteVideo, updateVideoStatus } = useStore();

  // 轮询处理中的视频状态
  useEffect(() => {
    const processingVideos = myVideos.filter(v => v.status === 'processing' && v.taskId);
    
    if (processingVideos.length === 0) return;

    const pollInterval = setInterval(async () => {
      for (const video of processingVideos) {
        try {
          const status = await api.queryVideoTask(video.taskId!);
          
          console.log(`[轮询] 视频${video.id}状态:`, status);
          
          // 更新进度
          if (status.progress !== undefined && typeof status.progress === 'number') {
            updateVideoStatus(video.id, { progress: status.progress });
          }
          
          // 检查任务状态
          if (status.status === 'completed') {
            console.log(`[完成] 视频${video.id}生成完成`);
            updateVideoStatus(video.id, {
              status: 'completed',
              url: status.video_url || status.url || video.url,
              thumbnail: status.thumbnail || video.thumbnail,
              progress: 100
            });
          } else if (status.status === 'failed') {
            console.error(`[失败] 视频${video.id}生成失败:`, status.error);
            updateVideoStatus(video.id, {
              status: 'failed',
              error: status.error || status.message || '生成失败'
            });
          }
        } catch (error) {
          console.error(`查询视频${video.id}状态失败:`, error);
          // 不立即标记为失败，继续轮询
        }
      }
    }, 3000); // 每3秒轮询一次

    return () => clearInterval(pollInterval);
  }, [myVideos, updateVideoStatus]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (video: any) => {
    switch (video.status) {
      case 'processing':
        return (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-lg">
            <Loader2 size={12} className="animate-spin" />
            生成中 {video.progress ? `${video.progress}%` : ''}
          </div>
        );
      case 'completed':
        return (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-lg">
            <CheckCircle2 size={12} />
            已完成
          </div>
        );
      case 'failed':
        return (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-lg" title={video.error}>
            <XCircle size={12} />
            失败
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/30">
      <div className="p-8 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Film className="text-cyan-600" />
          我的视频
          <span className="text-sm font-normal text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
            {myVideos.length}
          </span>
        </h2>
        <p className="text-slate-500 mt-2 text-sm">管理您生成的所有 AI 视频作品</p>
        
        {/* 3天有效期提醒 */}
        <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">重要提醒</h3>
            <p className="text-sm text-amber-700">
              受限于当前的测试环境，视频的保存时间只有 <span className="font-bold">3天</span>，生成成功的视频请在3天内下载保存到本地。
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
        {myVideos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
              <Film size={40} className="text-slate-300" />
            </div>
            <p className="text-lg text-slate-600">暂无视频</p>
            <p className="text-sm mt-2">快去 AI 导演创作您的第一个视频吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myVideos.map((video) => (
              <div 
                key={video.id} 
                className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-cyan-400/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                {/* Thumbnail Container */}
                <div className="aspect-[9/16] relative bg-slate-100">
                  {/* 状态徽章 */}
                  {getStatusBadge(video)}
                  
                  <img 
                    src={video.thumbnail || video.url} 
                    alt={video.productName}
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-500",
                      video.status === 'completed' && "group-hover:scale-105",
                      video.status === 'processing' && "opacity-50"
                    )}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop';
                    }}
                  />
                  
                  {/* 进度条 */}
                  {video.status === 'processing' && video.progress !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${video.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Overlay - 只在完成时显示 */}
                  {video.status === 'completed' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <div className="flex items-center justify-center absolute inset-0">
                        <button 
                          onClick={() => window.open(video.url, '_blank')}
                          className="w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-cyan-500/30 hover:bg-cyan-400"
                        >
                          <Play size={20} fill="currentColor" className="ml-1" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Top Actions */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => deleteVideo(video.id)}
                      className="p-2 bg-white/90 backdrop-blur-md text-red-500 hover:text-red-600 rounded-lg hover:bg-white transition-colors shadow-sm"
                      title="删除视频"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 border-t border-slate-100 bg-white">
                  <h3 className="font-bold text-slate-800 truncate mb-1" title={video.productName}>
                    {video.productName}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(video.createdAt)}
                    </div>
                    {video.status === 'completed' && (
                      <button 
                        className="flex items-center gap-1 text-cyan-600 hover:text-cyan-500 transition-colors font-medium"
                        onClick={() => window.open(video.url, '_blank')}
                      >
                        <Download size={12} />
                        下载
                      </button>
                    )}
                    {video.status === 'processing' && (
                      <span className="text-blue-600 font-medium">
                        处理中...
                      </span>
                    )}
                    {video.status === 'failed' && (
                      <span className="text-red-600 font-medium" title={video.error}>
                        生成失败
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
