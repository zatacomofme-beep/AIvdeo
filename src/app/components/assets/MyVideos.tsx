import { Play, Download, Trash2, Clock, Film, Loader2, CheckCircle2, XCircle, AlertTriangle, Globe, Lock } from 'lucide-react';
import { useStore } from "../../lib/store";
import { cn } from "../../lib/utils";
import { api } from '../../../lib/api';
import { useEffect, useState } from 'react';

export function MyVideos() {
  const { myVideos, deleteVideo, updateVideoStatus, toggleVideoPublic } = useStore();
  
  const [toggling, setToggling] = useState<{ [key: string]: boolean }>({});  // 新增：跟踪公开状态切换中
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);  // 新增：当前播放的视频ID

  // 新增：播放视频
  const handlePlayVideo = (video: any) => {
    if (video.status !== 'completed' || !video.url) {
      alert('视频尚未完成，无法播放');
      return;
    }
    setPlayingVideo(video.id);
  };

  // 新增：切换视频公开状态
  const handleTogglePublic = async (video: any) => {
    if (video.status !== 'completed') {
      alert('只有已完成的视频才能分享到内容广场');
      return;
    }

    setToggling({ ...toggling, [video.id]: true });
    
    try {
      const newPublicStatus = !video.isPublic;
      await toggleVideoPublic(video.id, newPublicStatus);
      alert(newPublicStatus ? '✅ 已开放到内容广场' : '✅ 已从内容广场移除');
    } catch (error) {
      console.error('切换公开状态失败:', error);
    } finally {
      setToggling({ ...toggling, [video.id]: false });
    }
  };

  // 页面加载时查询一次处理中的视频状态
  useEffect(() => {
    const checkProcessingVideos = async () => {
      const processingVideos = myVideos.filter(v => 
        v.status === 'processing' && v.taskId
      );
      
      if (processingVideos.length === 0) {
        console.log('[页面加载] 没有处理中的视频');
        return;
      }
      
      console.log(`[页面加载] 发现 ${processingVideos.length} 个处理中的视频，开始查询状态...`);
      
      for (const video of processingVideos) {
        try {
          console.log(`[查询] 视频${video.id}, taskId: ${video.taskId}`);
          const status = await api.queryVideoTask(video.taskId!);
          console.log(`[查询] 视频${video.id}状态:`, status);
          
          // 更新进度
          if (status.progress !== undefined && typeof status.progress === 'number') {
            updateVideoStatus(video.id, { progress: status.progress });
          }
          
          // 检查任务状态
          if (status.status === 'completed') {
            console.log(`[完成] 视频${video.id}已生成完成`);
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
          } else {
            console.log(`[处理中] 视频${video.id}仍在生成，进度: ${status.progress || 0}%`);
          }
        } catch (error) {
          console.error(`[查询] 视频${video.id}查询失败:`, error);
        }
        
        // 避免频繁请求，每个视频查询之间间隔300ms
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      console.log('[页面加载] 所有处理中的视频状态查询完成');
    };
    
    // 组件加载时立即执行查询
    checkProcessingVideos();
  }, []); // 空依赖数组，只在组件挂载时执行一次

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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      <div className="p-8 pb-4 border-b border-slate-200">
        <h2 className="text-3xl font-semibold text-slate-900 flex items-center gap-3">
          <Film className="text-tech" size={32} />
          我的视频
          <span className="badge-tech ml-2">
            {myVideos.length}
          </span>
        </h2>
        <p className="text-slate-600 mt-2 text-sm">管理您生成的所有 AI 视频作品</p>
        
        {/* 3天有效期提醒 */}
        <div className="mt-4 tech-card p-4 bg-amber-50 border-amber-300">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">重要提醒</h3>
            <p className="text-sm text-amber-700">
              受限于当前的测试环境，视频的保存时间只有 <span className="font-bold">3天</span>，生成成功的视频请在3天内下载保存到本地。
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar bg-slate-50">
        {myVideos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center mb-4 border border-slate-200">
              <Film size={40} className="text-slate-300" />
            </div>
            <p className="text-lg text-slate-600">暂无视频</p>
            <p className="text-sm mt-2">快去 AI 导演创作您的第一个视频吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {myVideos.map((video) => (
              <div 
                key={video.id} 
                className="tech-card group relative overflow-hidden hover:shadow-tech-md transition-all"
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
                  
                  {/* 已完成视频：显示播放按钮 */}
                  {video.status === 'completed' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <div className="flex items-center justify-center absolute inset-0">
                        <button 
                          onClick={() => handlePlayVideo(video)}
                          className="w-12 h-12 rounded-full bg-tech text-white flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-tech-glow hover:bg-tech-hover"
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
                  <h3 className="font-semibold text-slate-900 truncate mb-1" title={video.productName}>
                    {video.productName}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(video.createdAt)}
                    </div>
                    {video.status === 'completed' && (
                      <button 
                        className="flex items-center gap-1 text-tech hover:text-tech-hover transition-colors font-medium"
                        onClick={() => window.open(video.url, '_blank')}
                      >
                        <Download size={12} />
                        下载
                      </button>
                    )}
                    {video.status === 'processing' && (
                      <span className="text-blue-600 font-medium">
                        {video.progress ? `${video.progress}%` : '处理中...'}
                      </span>
                    )}
                    {video.status === 'failed' && (
                      <span className="text-red-600 font-medium" title={video.error}>
                        生成失败
                      </span>
                    )}
                  </div>
                  {/* 处理中：不显示任何按钮，状态会自动更新 */}
                  {/* 已完成的视频显示公开/私密切换按钮 */}
                  {video.status === 'completed' && (
                    <button
                      onClick={() => handleTogglePublic(video)}
                      disabled={toggling[video.id]}
                      className={cn(
                        "mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                        video.isPublic 
                          ? "bg-green-50 hover:bg-green-100 text-green-700 border border-green-300"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300"
                      )}
                    >
                      {toggling[video.id] ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          处理中...
                        </>
                      ) : (
                        <>
                          {video.isPublic ? (
                            <>
                              <Globe size={14} />
                              已开放
                            </>
                          ) : (
                            <>
                              <Lock size={14} />
                              未开放
                            </>
                          )}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
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
              src={myVideos.find(v => v.id === playingVideo)?.url}
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
