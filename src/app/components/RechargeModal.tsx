import React, { useState } from 'react';
import { useState } from 'react';
import { X, Zap, Check, CreditCard, Smartphone } from 'lucide-react';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { showToast } from '../lib/toast-utils';  // ✅ 导入 toast 工具

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecharge: (amount: number, credits: number, method: string) => void;
}

export function RechargeModal({ isOpen, onClose, onRecharge }: RechargeModalProps) {
  const { user } = useStore();  // 获取当前登录用户
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ url: string; orderNo: string; amount: number; credits: number } | null>(null);
  const [pollIntervalId, setPollIntervalId] = useState<NodeJS.Timeout | null>(null);

  if (!isOpen) return null;

  const packages = [
    { 
      id: 1, 
      credits: 1000, 
      price: 10, 
      label: '小额充值',
      bonus: 0,
      popular: false,
      icon: '💳',
      desc: '新手入门'
    },
    { 
      id: 2, 
      credits: 4900, 
      price: 49, 
      label: '标准充值',
      bonus: 300,
      popular: true,
      icon: '⭐',
      desc: '额外赠送+300'
    },
    { 
      id: 3, 
      credits: 9900, 
      price: 99, 
      label: '超值充值',
      bonus: 1100,
      popular: false,
      icon: '🚀',
      desc: '额外赠送+1100'
    },
    { 
      id: 4, 
      credits: 49900, 
      price: 499, 
      label: '高级充值',
      bonus: 8100,
      popular: false,
      icon: '💎',
      desc: '额外赠送+8100'
    },
  ];

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  // 停止轮询
  const stopPolling = () => {
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      setPollIntervalId(null);
    }
  };

  // 关闭二维码弹窗
  const closeQrCode = () => {
    stopPolling();
    setQrCodeData(null);
    setIsProcessing(false);
  };

  const handleRecharge = async () => {
    if (!selectedPkg) {
      showToast.warning('请选择套餐', '请选择充值套餐');
      return;
    }

    // 检查用户是否登录
    if (!user || !user.id) {
      showToast.warning('请先登录', '请先登录后再充值');
      onClose();
      return;
    }

    setIsProcessing(true);
    
    try {
      // 调用后端接口创建微信支付订单
      const response = await fetch('/api/wechat/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_id: ['small', 'medium', 'large', 'super'][selectedPkg.id - 1],
          user_id: user.id,  // 使用真实的用户ID
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 显示二维码弹窗
        setQrCodeData({
          url: result.qr_code_url,
          orderNo: result.order_no,
          amount: result.amount,
          credits: result.credits
        });
        setIsProcessing(false);
        
        // 等待 1 秒后开始轮询
        setTimeout(() => {
          console.log('开始轮询支付状态...');
          
          const pollInterval = setInterval(async () => {
            try {
              console.log(`查询订单状态: ${result.order_no}`);
              const statusResponse = await fetch(`/api/wechat/query-order/${result.order_no}`);
              const statusResult = await statusResponse.json();
              
              if (statusResult.success && statusResult.paid) {
                console.log('支付成功！');
                
                // ✅ 关键修复：立即清除轮询
                clearInterval(pollInterval);
                setPollIntervalId(null);
                setQrCodeData(null);
                
                const totalCredits = selectedPkg.credits + selectedPkg.bonus;
                
                // 使用 useStore 的 loadUserData 重新加载用户数据
                import('../lib/store').then(({ useStore }) => {
                  const { loadUserData } = useStore.getState();
                  loadUserData(user.id).then(() => {
                    console.log('✅ 用户数据已重新加载');
                    showToast.success('充值成功', `获得 ${totalCredits} 积分`);
                    onClose();
                  }).catch(err => {
                    console.error('加载用户数据失败:', err);
                    showToast.success('充值成功', `获得 ${totalCredits} 积分\n\n请刷新页面查看最新积分`);
                    onClose();
                  });
                }).catch(err => {
                  console.error('导入store失败:', err);
                  showToast.success('充值成功', `获得 ${totalCredits} 积分\n\n请刷新页面查看最新积分`);
                  window.location.reload();
                });
                
                // ✅ 重要：立即return，防止后续代码执行
                return;
              }
            } catch (error) {
              console.error('查询支付状态失败:', error);
            }
          }, 5000);
          
          setPollIntervalId(pollInterval);
          
          // 5 分钟后停止查询
          setTimeout(() => {
            console.log('支付超时，停止轮询');
            stopPolling();
            if (qrCodeData) {
              showToast.warning('支付超时', '请重新尝试');
              closeQrCode();
            }
          }, 300000);
        }, 1000);
      } else {
        throw new Error(result.error || '创建订单失败');
      }
    } catch (error) {
      console.error('充值失败:', error);
      showToast.error('充值失败', String(error));
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="w-[800px] max-h-[90vh] bg-white border border-slate-200 rounded-lg shadow-tech-lg flex flex-col overflow-hidden">
          {/* Business Tech Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-tech rounded-md flex items-center justify-center shadow-tech-sm">
                <Zap className="text-white" size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-slate-900">充值中心</h2>
                <p className="text-xs text-slate-500">Credits Recharge</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Info Banner - Business Tech */}
            <div className="tech-card p-4 mb-6 bg-tech-light/20 border-tech/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-tech rounded-md flex items-center justify-center shrink-0">
                  <Zap className="text-white" size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 mb-2">积分使用说明</p>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div className="bg-white rounded px-2 py-1.5 border border-slate-200">
                      <span className="text-slate-600 font-medium">生成脚本：</span>
                      <span className="text-slate-900 font-bold ml-1">30</span>
                    </div>
                    <div className="bg-white rounded px-2 py-1.5 border border-slate-200">
                      <span className="text-slate-600 font-medium">生成视频：</span>
                      <span className="text-slate-900 font-bold ml-1">70</span>
                    </div>
                    <div className="bg-white rounded px-2 py-1.5 border border-slate-200">
                      <span className="text-slate-600 font-medium">完整流程：</span>
                      <span className="text-slate-900 font-bold ml-1">100</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">
                    1元 = 100积分 • 积分永久有效 • 多充多送
                  </p>
                </div>
              </div>
            </div>

            {/* Packages - Business Tech Cards */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">选择套餐</h3>
              <div className="grid grid-cols-2 gap-3">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={cn(
                      "tech-card p-4 text-left transition-all",
                      selectedPackage === pkg.id && "tech-card-active"
                    )}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-1.5 right-3 badge-tech-ai text-xs px-2 py-0.5">
                        推荐
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-xs text-slate-500 mb-1">{pkg.label}</div>
                        <div className="text-2xl font-bold text-slate-900">¥{pkg.price}</div>
                      </div>
                      {selectedPackage === pkg.id && (
                        <div className="w-5 h-5 bg-tech rounded-full flex items-center justify-center">
                          <Check className="text-white" size={12} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="text-tech" size={14} />
                      <span className="font-semibold text-slate-900">{pkg.credits.toLocaleString()} 积分</span>
                      {pkg.bonus > 0 && (
                        <span className="badge-tech-success text-xs ml-auto">+{pkg.bonus}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">支付方式</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('alipay')}
                  className={cn(
                    "tech-card p-3 flex items-center gap-3 transition-all",
                    paymentMethod === 'alipay' && "tech-card-active"
                  )}
                >
                  <CreditCard size={20} className={paymentMethod === 'alipay' ? 'text-tech' : 'text-slate-400'} />
                  <span className="font-medium text-sm">支付宝</span>
                  {paymentMethod === 'alipay' && <Check size={16} className="text-tech ml-auto" />}
                </button>
                
                <button
                  onClick={() => setPaymentMethod('wechat')}
                  className={cn(
                    "tech-card p-3 flex items-center gap-3 transition-all",
                    paymentMethod === 'wechat' && "tech-card-active"
                  )}
                >
                  <Smartphone size={20} className={paymentMethod === 'wechat' ? 'text-tech' : 'text-slate-400'} />
                  <span className="font-medium text-sm">微信支付</span>
                  {paymentMethod === 'wechat' && <Check size={16} className="text-tech ml-auto" />}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-6 bg-slate-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">应付金额</div>
                <div className="text-2xl font-bold text-slate-900">
                  {selectedPkg ? `¥${selectedPkg.price}` : '¥0'}
                </div>
              </div>
              {selectedPkg && selectedPkg.bonus > 0 && (
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">获得积分</div>
                  <div className="text-lg font-bold text-tech">
                    {(selectedPkg.credits + selectedPkg.bonus).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleRecharge}
              disabled={!selectedPkg || isProcessing}
              className="btn-tech-ai w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '处理中...' : '确认充值'}
            </button>
          </div>
        </div>
      </div>

      {/* 二维码支付弹窗 */}
      {qrCodeData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="w-[400px] bg-white rounded-lg shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">微信扫码支付</h3>
              <button
                onClick={closeQrCode}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              {/* 二维码 */}
              <div className="p-4 bg-white border-2 border-slate-200 rounded-lg">
                <QRCodeSVG 
                  value={qrCodeData.url} 
                  size={200}
                  level="H"
                />
              </div>

              {/* 提示信息 */}
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">
                  请使用<span className="font-semibold text-green-600">微信扫一扫</span>完成支付
                </p>
                <div className="text-xs text-slate-500">
                  <p>订单号：{qrCodeData.orderNo}</p>
                  <p className="mt-1">
                    支付金额：<span className="font-semibold text-tech">¥{qrCodeData.amount}</span>
                  </p>
                  <p className="mt-1">
                    获得积分：<span className="font-semibold text-tech">{qrCodeData.credits}</span>
                  </p>
                </div>
              </div>

              {/* 等待支付提示 */}
              <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 text-center">
                  ⏳ 等待支付中...支付完成后自动跳转
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
