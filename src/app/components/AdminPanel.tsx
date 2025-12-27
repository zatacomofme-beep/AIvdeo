import React, { useState, useEffect } from 'react';
import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Video, MessageSquare, DollarSign, 
  Check, X, Eye, Trash2, Search, Filter, Crown,
  Loader2, TrendingUp, UserPlus, LogOut, ChevronLeft, ChevronRight,
  Plus, Upload, Star, Edit2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from '../../lib/toast';

const API_BASE_URL = 'https://semopic.com';

// 精选视频添加/编辑弹窗
function FeaturedVideoModal({ video, onClose, onSuccess }: {
  video: FeaturedVideo | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: video?.title || '',
    subtitle: video?.subtitle || '',
    videoUrl: video?.videoUrl || '',
    thumbnailUrl: video?.thumbnailUrl || '',
    category: video?.category || '美妆护肤',
    tags: video?.tags?.join(', ') || '',
    displayOrder: video?.displayOrder || 0,
    isActive: video?.isActive !== false,
    productName: video?.productName || '',
    platform: video?.platform || 'TikTok',
    description: video?.description || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        subtitle: formData.subtitle,
        video_url: formData.videoUrl,
        thumbnail_url: formData.thumbnailUrl,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        display_order: formData.displayOrder,
        is_active: formData.isActive,
        product_name: formData.productName,
        platform: formData.platform,
        description: formData.description
      };

      const url = video
        ? `${API_BASE_URL}/api/admin/featured-videos/${video.id}`
        : `${API_BASE_URL}/api/admin/featured-videos`;
      
      const response = await fetch(url, {
        method: video ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('提交失败');
      }

      toast.success(video ? '更新成功!' : '添加成功!');
      onSuccess();
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">
            {video ? '编辑精选视频' : '添加精选视频'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">视频标题 *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="例：Nike Air Max"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">副标题</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="例：运动鞋服 / TikTok"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">视频 URL (TOS) *</label>
            <input
              type="url"
              required
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="https://tos-url/video.mp4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">缩略图 URL (TOS) *</label>
            <input
              type="url"
              required
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="https://tos-url/thumbnail.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">分类 *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="美妆护肤">美妆护肤</option>
                <option value="3C数码">3C数码</option>
                <option value="服装鞋帽">服装鞋帽</option>
                <option value="家居生活">家居生活</option>
                <option value="食品饮料">食品饮料</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">平台 *</label>
              <select
                required
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="TikTok">TikTok</option>
                <option value="Reels">Reels</option>
                <option value="Shorts">Shorts</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">标签 (逗号分隔)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="例：运动, TikTok, 爆款"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">显示顺序</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="0"
              />
              <p className="text-xs text-slate-500 mt-1">数字越小越靠前</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">商品名称</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="例：Nike Air Max"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">详细描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows={3}
              placeholder="视频的详细描述..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              在官网展示
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  提交中...
                </>
              ) : (
                video ? '保存修改' : '添加视频'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface User {
  id: string;
  email: string;
  credits: number;
  createdAt: number;
  role: 'user' | 'admin';
  totalRecharge?: number;  // 新增：总充值金额
  rechargeCount?: number;  // 新增：充值次数
  totalConsume?: number;   // 新增：总消费积分
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

interface FeaturedVideo {
  id: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  displayOrder: number;
  isActive: boolean;
  viewCount: number;
  likeCount: number;
  productName: string;
  platform: string;
  description: string;
  createdAt: number;
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'videos' | 'prompts' | 'stats' | 'featured'>('stats');
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoForReview[]>([]);
  const [prompts, setPrompts] = useState<PromptForReview[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFeatured, setShowAddFeatured] = useState(false);
  const [editingFeatured, setEditingFeatured] = useState<FeaturedVideo | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    publicVideos: 0,
    totalCreditsUsed: 0,
    totalRecharge: 0  // 新增：总充值金额
  });
  
  // 新增：提示词分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    fetchAdminData();
    // 提示词切换页码时重置到第1页
    if (activeTab !== 'prompts') {
      setCurrentPage(1);
    }
  }, [activeTab]);

  // 新增：提示词分页加载
  useEffect(() => {
    if (activeTab === 'prompts') {
      fetchPromptsPage();
    }
  }, [currentPage, activeTab]);

  const fetchPromptsPage = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/prompts?page=${currentPage}&page_size=${pageSize}`
      );
      const data = await response.json();
      setPrompts(data.prompts || []);
      setTotalPages(Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error('获取提示词失败:', error);
    } finally {
      setLoading(false);
    }
  };

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
      } else if (activeTab === 'featured') {
        const response = await fetch(`${API_BASE_URL}/api/featured-videos`);
        const data = await response.json();
        if (data.success) {
          setFeaturedVideos(data.videos || []);
        }
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
    
    const parsedCredits = parseInt(newCredits);
    if (isNaN(parsedCredits) || parsedCredits < 0) {
      toast.warning('请输入有效的积分值（正整数）');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/user/${userId}/credits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: parsedCredits })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '更新失败');
      }
      
      console.log('✅ 积分更新成功');
      // 刷新用户列表
      await fetchAdminData();
      toast.success(`积分已更新为 ${parsedCredits}`);
    } catch (error) {
      console.error('更新积分失败:', error);
      toast.error(`更新积分失败: ${error}`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/30">
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
            { id: 'prompts', label: '提示词管理', icon: MessageSquare },
            { id: 'featured', label: '精选视频', icon: Star }
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
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">总充值</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">充值次数</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">总消费</th>
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
                            <div className="font-medium text-slate-900 text-sm max-w-[120px] truncate">{user.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {user.credits}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-orange-600">
                            ￥{(user.totalRecharge || 0) / 100}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {user.rechargeCount || 0}次
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {user.totalConsume || 0}积分
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
                        <td className="px-6 py-4 text-slate-600 text-xs">{formatDate(user.createdAt)}</td>
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
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase w-[200px]">商品名称</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">提示词内容</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase w-[180px]">用户</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase w-[150px]">创建时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {prompts.map((prompt) => (
                        <tr key={prompt.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <MessageSquare size={16} className="text-purple-500 flex-shrink-0" />
                              <span className="font-medium text-slate-900 truncate">{prompt.productName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600 line-clamp-2 font-mono bg-slate-50 p-2 rounded">
                              {prompt.content}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">{prompt.userEmail}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-500">{formatDate(prompt.createdAt)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* 分页控件 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-6 py-4">
                    <div className="text-sm text-slate-600">
                      第 {currentPage} / {totalPages} 页
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors",
                          currentPage === 1
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                        )}
                      >
                        <ChevronLeft size={16} />
                        上一页
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors",
                          currentPage === totalPages
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                        )}
                      >
                        下一页
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Featured Videos Tab */}
            {activeTab === 'featured' && (
              <div className="space-y-6">
                {/* 添加按钮 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">精选视频管理</h3>
                    <p className="text-sm text-slate-500 mt-1">管理官网展示的精选视频案例</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingFeatured(null);
                      setShowAddFeatured(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all"
                  >
                    <Plus size={18} />
                    添加精选视频
                  </button>
                </div>

                {/* 视频列表 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredVideos.map((video) => (
                    <div key={video.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group">
                      <div className="aspect-[9/16] relative bg-slate-100">
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                        {!video.isActive && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                            已隐藏
                          </div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs rounded-full flex items-center gap-1">
                          <Star size={12} />
                          #{video.displayOrder}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-1">{video.title}</h3>
                            <p className="text-xs text-slate-500">{video.subtitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">{video.category}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">{video.platform}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                          <Eye size={12} />
                          {video.viewCount}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingFeatured(video);
                              setShowAddFeatured(true);
                            }}
                            className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                          >
                            <Edit2 size={14} />
                            编辑
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('确定要删除这个精选视频吗？')) return;
                              try {
                                await fetch(`${API_BASE_URL}/api/admin/featured-videos/${video.id}`, {
                                  method: 'DELETE'
                                });
                                fetchAdminData();
                              } catch (error) {
                                console.error('删除失败:', error);
                                toast.error('删除失败');
                              }
                            }}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 添加/编辑弹窗 */}
                {showAddFeatured && (
                  <FeaturedVideoModal
                    video={editingFeatured}
                    onClose={() => {
                      setShowAddFeatured(false);
                      setEditingFeatured(null);
                    }}
                    onSuccess={() => {
                      setShowAddFeatured(false);
                      setEditingFeatured(null);
                      fetchAdminData();
                    }}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
