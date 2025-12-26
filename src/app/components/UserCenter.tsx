import React, { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { X, User, Mail, CreditCard, History, Settings, LogOut, Edit2, Check } from 'lucide-react';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';
import { api } from '../../lib/api';  // 修复路径：src/app/components -> src/lib

interface UserCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function UserCenter({ isOpen, onClose, onLogout }: UserCenterProps) {
  const { user, credits } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'history'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(user?.username || '');
  
  // 统计数据状态
  const [stats, setStats] = useState({
    videoCount: 0,
    productCount: 0,
    totalConsumed: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // 新增：充值记录和使用记录状态
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  // 获取用户统计数据
  useEffect(() => {
    if (isOpen && user) {
      fetchUserInfo();      // 新增：先刷新用户信息（包括积分）
      fetchUserStats();
      fetchCreditsHistory();  // 新增：加载积分历史
    }
  }, [isOpen, user]);

  // 新增：刷新用户信息（包括积分）
  const fetchUserInfo = async () => {
    if (!user) return;
    
    try {
      const data = await api.getUserInfo(user.id);
      if (data && data.credits !== undefined) {
        // 更新 store 中的积分
        const { setCredits } = useStore.getState();
        setCredits(data.credits);
        console.log('✅ 用户积分已刷新:', data.credits);
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    
    setStatsLoading(true);
    try {
      const data = await api.getUserStats(user.id);
      if (data) {
        setStats({
          videoCount: data.videoCount,
          productCount: data.productCount,
          totalConsumed: data.totalConsumed
        });
      } else {
        console.warn('统计API返回null，使用默认值');
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // 新增：获取积分历史（充值+使用）
  const fetchCreditsHistory = async () => {
    if (!user) return;
    
    setBillingLoading(true);
    setHistoryLoading(true);
    
    try {
      const data = await api.getCreditsHistory(user.id);
      
      // 分离充值记录（amount > 0）和使用记录（amount < 0）
      const recharges = data.history.filter((item: any) => item.amount > 0);
      const usages = data.history.filter((item: any) => item.amount < 0);
      
      setBillingHistory(recharges);
      setUsageHistory(usages);
      
      console.log('✅ 加载积分历史成功:', {
        充值记录: recharges.length,
        使用记录: usages.length
      });
    } catch (error) {
      console.error('获取积分历史失败:', error);
    } finally {
      setBillingLoading(false);
      setHistoryLoading(false);
    }
  };

  // 格式化时间
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取操作类型显示名称
  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      'recharge': '充值',
      'generate_video': '生成视频',
      'generate_script': '生成脚本',
      'generate_nine_grid': '生成九宫格',
      'create_character': '创建角色',
      'manual_adjust': '管理员调整'
    };
    return actionMap[action] || action;
  };

  const tabs = [
    { id: 'profile', label: '个人资料', icon: User },
    { id: 'billing', label: '充值记录', icon: CreditCard },
    { id: 'history', label: '使用记录', icon: History },
  ];

  const handleSaveProfile = () => {
    // TODO: 调用API更新用户信息
    console.log('保存用户信息:', editedUsername);
    setIsEditing(false);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[800px] max-h-[90vh] bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <h2 className="font-semibold text-lg text-slate-800">个人中心</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info Banner */}
        <div className="bg-slate-50 p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-tech rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-tech-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900">{user.username}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 mb-1">可用积分</div>
              <div className="text-3xl font-bold text-tech">{credits}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 px-6">
          <div className="flex gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 border-b-2 transition-all",
                    isActive
                      ? "border-tech text-slate-900"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">基本信息</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditedUsername(user.username);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      编辑
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 btn-tech-ai rounded-lg flex items-center gap-2 text-sm font-semibold"
                      >
                        <Check size={16} />
                        保存
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-500 mb-2">用户名</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUsername}
                        onChange={(e) => setEditedUsername(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-tech focus:ring-2 focus:ring-tech/20 transition-all"
                      />
                    ) : (
                      <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                        {user.username}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-slate-500 mb-2">邮箱</label>
                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                      {user.email}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">邮箱不可修改</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-500 mb-2">注册时间</label>
                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4 text-center shadow-sm">
                  {statsLoading ? (
                    <div className="text-2xl font-bold text-slate-300">--</div>
                  ) : (
                    <div className="text-2xl font-bold text-tech">{stats.videoCount}</div>
                  )}
                  <div className="text-sm text-slate-500 mt-1">生成视频数</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 text-center shadow-sm">
                  {statsLoading ? (
                    <div className="text-2xl font-bold text-slate-300">--</div>
                  ) : (
                    <div className="text-2xl font-bold text-tech">{stats.productCount}</div>
                  )}
                  <div className="text-sm text-slate-500 mt-1">保存商品数</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 text-center shadow-sm">
                  {statsLoading ? (
                    <div className="text-2xl font-bold text-slate-300">--</div>
                  ) : (
                    <div className="text-2xl font-bold text-tech">
                      {stats.totalConsumed.toLocaleString()}
                    </div>
                  )}
                  <div className="text-sm text-slate-500 mt-1">总消费积分</div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">充值记录</h3>
                {billingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-tech border-t-transparent" />
                  </div>
                ) : billingHistory.length > 0 ? (
                  <div className="space-y-2">
                    {billingHistory.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            {getActionLabel(record.action)}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {formatDate(record.createdAt)}
                          </div>
                          {record.description && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              {record.description}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            +{record.amount}
                          </div>
                          <div className="text-xs text-slate-400">
                            余额 {record.balanceAfter}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    暂无充值记录
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">使用记录</h3>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-tech border-t-transparent" />
                  </div>
                ) : usageHistory.length > 0 ? (
                  <div className="space-y-2">
                    {usageHistory.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            {getActionLabel(record.action)}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {formatDate(record.createdAt)}
                          </div>
                          {record.description && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              {record.description}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-red-500">
                            {record.amount}
                          </div>
                          <div className="text-xs text-slate-400">
                            余额 {record.balanceAfter}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    暂无使用记录
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-6 bg-white">
          <button
            onClick={onLogout}
            className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium border border-red-100"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
