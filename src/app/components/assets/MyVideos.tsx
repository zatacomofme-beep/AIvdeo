import { Play, Download, Trash2, Clock, Film, Loader2, CheckCircle2, XCircle, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useStore } from "../../lib/store";
import { cn } from "../../lib/utils";
import { api } from '../../../lib/api';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardFooter, Progress, Button, Chip, Tooltip } from '@heroui/react';

export function MyVideos() {
  const { myVideos, deleteVideo, updateVideoStatus } = useStore();
  
  // 跟踪每个视频的上次查询时间（3分钟冷却）
  const [lastQueryTime, setLastQueryTime] = useState<{ [key: string]: number }>({});
  const [querying, setQuerying] = useState<{ [key: string]: boolean }>({});

  // 手动查询视频状态
  const handleManualQuery = async (video: any) => {
    const now = Date.now();
    const lastTime = lastQueryTime[video.id] || 0;
    const cooldown = 3 * 60 * 1000; // 3分钟
    
    // 检查冷却时间
    if (now - lastTime < cooldown) {
      const remainingSeconds = Math.ceil((cooldown - (now - lastTime)) / 1000);
      alert(`请等待 ${Math.floor(remainingSeconds / 60)} 分 ${remainingSeconds % 60} 秒后再查询`);
      return;
    }

    setQuerying({ ...querying, [video.id]: true });
    
    try {
      console.log(`[手动查询] 视频${video.id}`);
      const status = await api.queryVideoTask(video.taskId!);
      console.log(`[手动查询] 视频${video.id}状态:`, status);
      
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
        alert('✅ 视频生成完成！');
      } else if (status.status === 'failed') {
        console.error(`[失败] 视频${video.id}生成失败:`, status.error);
        updateVideoStatus(video.id, {
          status: 'failed',
          error: status.error || status.message || '生成失败'
        });
        alert(`❌ 视频生成失败: ${status.error || '未知错误'}`);
      } else {
        alert(`🔄 视频仍在生成中，进度: ${status.progress || 0}%`);
      }
      
      // 更新最后查询时间
      setLastQueryTime({ ...lastQueryTime, [video.id]: now });
    } catch (error) {
      console.error(`手动查询失败:`, error);
      alert('⚠️ 查询失败，请稍后再试');
    } finally {
      setQuerying({ ...querying, [video.id]: false });
    }
  };

  // 轮询处理中的视频状态
  // 优化策略：5分钟、10分钟、15分钟、20分钟各查询一次，完成或失败后停止
  useEffect(() => {
    const processingVideos = myVideos.filter(v => v.status === 'processing' && v.taskId);
    
    if (processingVideos.length === 0) return;

    const timers: NodeJS.Timeout[] = [];

    // 定义查询函数
    const queryVideo = async (video: any, attemptNumber: number) => {
      try {
        console.log(`[自动查询${attemptNumber}] 视频${video.id} - ${attemptNumber * 5}分钟后查询`);
        const status = await api.queryVideoTask(video.taskId!);
        console.log(`[自动查询${attemptNumber}] 视频${video.id}状态:`, status);
        
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
          return true; // 返回true表示已完成，停止后续查询
        } else if (status.status === 'failed') {
          console.error(`[失败] 视频${video.id}生成失败:`, status.error);
          updateVideoStatus(video.id, {
            status: 'failed',
            error: status.error || status.message || '生成失败'
          });
          return true; // 返回true表示已失败，停止后续查询
        }
        return false; // 继续查询
      } catch (error) {
        console.error(`查询视频${video.id}状态失败:`, error);
        return false; // 查询失败，继续尝试下次查询
      }
    };

    for (const video of processingVideos) {
      let isFinished = false; // 标记视频是否已完成

      // 5分钟后第1次查询
      const timer1 = setTimeout(async () => {
        if (!isFinished) {
          isFinished = await queryVideo(video, 1);
        }
      }, 5 * 60 * 1000); // 5分钟
      timers.push(timer1);

      // 10分钟后第2次查询
      const timer2 = setTimeout(async () => {
        if (!isFinished) {
          isFinished = await queryVideo(video, 2);
        }
      }, 10 * 60 * 1000); // 10分钟
      timers.push(timer2);

      // 15分钟后第3次查询
      const timer3 = setTimeout(async () => {
        if (!isFinished) {
          isFinished = await queryVideo(video, 3);
        }
      }, 15 * 60 * 1000); // 15分钟
      timers.push(timer3);

      // 20分钟后第4次查询（最后一次）
      const timer4 = setTimeout(async () => {
        if (!isFinished) {
          const finished = await queryVideo(video, 4);
          // 如果20分钟后还没完成，标记为超时失败
          if (!finished) {
            console.log(`[超时] 视频${video.id} 20分钟后仍在处理中，标记为失败`);
            updateVideoStatus(video.id, {
              status: 'failed',
              error: '视频生成超时（超过20分钟）',
              progress: 0
            });
          }
        }
      }, 20 * 60 * 1000); // 20分钟
      timers.push(timer4);
    }

    return () => {
      // 清理所有定时器
      timers.forEach(timer => clearTimeout(timer));
    };
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
        <Card className="mt-4 bg-warning-50 border-warning-200">
          <CardBody className="flex flex-row gap-3 items-start">
            <AlertTriangle className="text-warning-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-warning-900 mb-1">重要提醒</h3>
              <p className="text-sm text-warning-700">
                受限于当前的测试环境，视频的保存时间只有 <span className="font-bold">3天</span>，生成成功的视频请在3天内下载保存到本地。
              </p>
            </div>
          </CardBody>
        </Card>
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
              <Card 
                key={video.id} 
                className="group overflow-hidden hover:scale-[1.02] transition-transform"
                isPressable={video.status === 'completed'}
                onPress={() => video.status === 'completed' && window.open(video.url, '_blank')}
              >
                <CardBody className="p-0">
                  {/* Thumbnail Container */}
                  <div className="aspect-[9/16] relative bg-slate-100">
                    {/* 状态徽章 - 使用 Chip */}
                    {video.status === 'processing' && (
                      <Chip 
                        className="absolute top-2 left-2 z-10" 
                        color="primary" 
                        variant="shadow"
                        startContent={<Loader2 size={14} className="animate-spin" />}
                      >
                        生成中 {video.progress ? `${video.progress}%` : ''}
                      </Chip>
                    )}
                    {video.status === 'completed' && (
                      <Chip 
                        className="absolute top-2 left-2 z-10" 
                        color="success" 
                        variant="shadow"
                        startContent={<CheckCircle2 size={14} />}
                      >
                        已完成
                      </Chip>
                    )}
                    {video.status === 'failed' && (
                      <Chip 
                        className="absolute top-2 left-2 z-10" 
                        color="danger" 
                        variant="shadow"
                        startContent={<XCircle size={14} />}
                      >
                        失败
                      </Chip>
                    )}
                    
                    <img 
                      src={video.thumbnail || video.url} 
                      alt={video.productName}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-500",
                        video.status === 'completed' && "group-hover:scale-110",
                        video.status === 'processing' && "opacity-50"
                      )}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop';
                      }}
                    />
                    
                    {/* 进度条 - 使用 Progress */}
                    {video.status === 'processing' && video.progress !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0">
                        <Progress 
                          size="sm" 
                          value={video.progress} 
                          color="primary"
                          className="rounded-none"
                        />
                      </div>
                    )}
                    
                    {/* Overlay - 只在完成时显示 */}
                    {video.status === 'completed' && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <div className="flex items-center justify-center absolute inset-0">
                          <Button
                            isIconOnly
                            color="primary"
                            variant="shadow"
                            className="w-14 h-14 transform scale-0 group-hover:scale-100 transition-transform duration-300"
                            onPress={() => window.open(video.url, '_blank')}
                          >
                            <Play size={24} fill="currentColor" className="ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Top Actions */}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Tooltip content="删除视频" color="danger">
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="shadow"
                          onPress={() => deleteVideo(video.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </CardBody>

                {/* Info */}
                <CardFooter className="flex-col items-start gap-2">
                  <h3 className="font-semibold text-slate-900 truncate w-full" title={video.productName}>
                    {video.productName}
                  </h3>
                  <div className="flex items-center justify-between w-full text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(video.createdAt)}
                    </div>
                    {video.status === 'completed' && (
                      <Button 
                        size="sm"
                        variant="light"
                        color="primary"
                        startContent={<Download size={12} />}
                        className="h-6 min-w-0 px-2 text-xs"
                        onPress={() => window.open(video.url, '_blank')}
                      >
                        下载
                      </Button>
                    )}
                  </div>
                  {/* 处理中的视频显示手动查询按钮 */}
                  {video.status === 'processing' && (
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      className="w-full"
                      startContent={querying[video.id] ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      isLoading={querying[video.id]}
                      onPress={() => handleManualQuery(video)}
                    >
                      {querying[video.id] ? '查询中...' : '刷新状态'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
