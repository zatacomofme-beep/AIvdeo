import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Video, MessageSquare, DollarSign, 
  Check, X, Eye, Trash2, Search, Filter, Crown,
  Loader2, TrendingUp, UserPlus, LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';

const API_BASE_URL = 'https://semopic.com';

interface User {
  id: string;
  email: string;
  credits: number;
  createdAt: number;
  role: 'user' | 'admin';
}

interface VideoForReview {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  script: string;
  createdAt: number;
  isPublic: boolean;
}

interface PromptForReview {
  id: string;
  userId: string;
  userEmail: string;
  productName: string;
  content: string;
  createdAt: number;
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'videos' | 'prompts' | 'stats'>('stats');
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoForReview[]>([]);
  const [prompts, setPrompts] = useState<PromptForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    publicVideos: 0,
    totalCreditsUsed: 0
  });

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`);
        const data = await response.json();
        setUsers(data.users || []);
      } else if (activeTab === 'videos') {
        const response = await fetch(`${API_BASE_URL}/api/admin/videos`);
        const data = await response.json();
        setVideos(data.videos || []);
      } else if (activeTab === 'prompts') {
        const response = await fetch(`${API_BASE_URL}/api/admin/prompts`);
        const data = await response.json();
        setPrompts(data.prompts || []);
      } else if (activeTab === 'stats') {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('获取管理员数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVideoPublic = async (videoId: string, isPublic: boolean) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/video/${videoId}/public`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic })
      });
      fetchAdminData();
    } catch (error) {
      console.error('切换视频公开状态失败:', error);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('确定要删除这个视频吗？')) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/video/${videoId}`, {
        method: 'DELETE'
      });
      fetchAdminData();
    } catch (error) {
      console.error('删除视频失败:', error);
    }
  };

  const handleUpdateUserCredits = async (userId: string, credits: number) => {
    const newCredits = prompt('请输入新的积分值:', credits.toString());
    if (!newCredits) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/user/${userId}/credits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: parseInt(newCredits) })
      });
      fetchAdminData();
    } catch (error) {
      console.error('更新积分失败:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/30">
      {/* Header */}
      <div className="p-8 pb-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                管理员控制台
                <Crown className="text-yellow-500" size={20} />
              </h2>
              <p className="text-slate-500 text-sm mt-1">系统管理与数据监控</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 py-4 bg-white border-b border-slate-200">
        <div className="flex gap-2">
          {[
            { id: 'stats', label: '数据统计', icon: TrendingUp },
            { id: 'users', label: '用户管理', icon: Users },
            { id: 'videos', label: '视频审核', icon: Video },
            { id: 'prompts', label: '提示词管理', icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  activeTab === tab.id
                    ? "bg-purple-100 text-purple-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-purple-500" size={40} />
            <span className="ml-3 text-slate-500">加载中...</span>
          </div>
        ) : (
          <>
            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Users size={24} />
                    <TrendingUp size={20} className="opacity-60" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stats.totalUsers}</div>
                  <div className="text-sm opacity-80">总用户数</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Video size={24} />
                    <TrendingUp size={20} className="opacity-60" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stats.totalVideos}</div>
                  <div className="text-sm opacity-80">总视频数</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Eye size={24} />
                    <TrendingUp size={20} className="opacity-60" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stats.publicVideos}</div>
                  <div className="text-sm opacity-80">公开视频数</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign size={24} />
                    <TrendingUp size={20} className="opacity-60" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stats.totalCreditsUsed}</div>
                  <div className="text-sm opacity-80">总消耗积分</div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">用户</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">邮箱</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">积分</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">角色</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">注册时间</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                              {user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-medium text-slate-900">{user.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {user.credits} Credits
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'admin' ? (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1 w-fit">
                              <Crown size={12} />
                              管理员
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">用户</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(user.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleUpdateUserCredits(user.id, user.credits)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                          >
                            调整积分
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div key={video.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all">
                    <div className="aspect-video relative bg-slate-100">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      {video.isPublic && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                          <Eye size={12} />
                          已公开
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-2">{video.title}</h3>
                      <p className="text-sm text-slate-500 mb-3">上传者: {video.userEmail}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVideoPublic(video.id, video.isPublic)}
                          className={cn(
                            "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1",
                            video.isPublic
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          )}
                        >
                          {video.isPublic ? (
                            <>
                              <X size={16} />
                              取消公开
                            </>
                          ) : (
                            <>
                              <Check size={16} />
                              设为公开
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Prompts Tab */}
            {activeTab === 'prompts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prompts.map((prompt) => (
                  <div key={prompt.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">{prompt.productName}</h3>
                      <MessageSquare size={16} className="text-purple-500" />
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-3 font-mono bg-slate-50 p-2 rounded">
                      {prompt.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{prompt.userEmail}</span>
                      <span>{formatDate(prompt.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
