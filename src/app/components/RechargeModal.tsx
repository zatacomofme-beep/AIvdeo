import React, { useState, useEffect } from 'react';
import { X, Zap, Check, CreditCard, Smartphone, Loader2, QrCode } from 'lucide-react';
import { cn } from '../lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../lib/store';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecharge: (amount: number, credits: number, method: string) => void;
}

export function RechargeModal({ isOpen, onClose, onRecharge }: RechargeModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPaymentProcessed, setIsPaymentProcessed] = useState(false); // 防止重复处理
  const { user } = useStore();

  // 清理轮询定时器
  useEffect(() => {
    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [pollingTimer]);

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
      credits: 5200, 
      price: 49, 
      label: '标准充值',
      bonus: 200,
      popular: true,
      icon: '⭐',
      desc: '最受欢迎'
    },
    { 
      id: 3, 
      credits: 11000, 
      price: 99, 
      label: '超值充值',
      bonus: 1000,
      popular: false,
      icon: '🚀',
      desc: '额外赠送10%'
    },
    { 
      id: 4, 
      credits: 58000, 
      price: 499, 
      label: '高级充倽',
      bonus: 8000,
      popular: false,
      icon: '💎',
      desc: '额外赠送16%'
    },
  ];

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  const handleRecharge = async () => {
    if (!selectedPkg) {
      alert('请选择充值套餐');
      return;
    }

    if (!user?.id) {
      alert('请先登录');
      return;
    }

    setIsProcessing(true);
    
    try {
      if (paymentMethod === 'wechat') {
        // 微信支付
        const response = await fetch('https://semopic.com/api/wechat/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            package_id: getPackageId(selectedPkg.id),
            user_id: user.id,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setQrCodeUrl(data.qr_code_url);
          setOrderNo(data.order_no);
          setShowQrCode(true);
          
          // 开始轮询查询支付状态
          startPolling(data.order_no);
        } else {
          alert('创建订单失败：' + (data.error || '未知错误'));
        }
      } else {
        // 支付宝支付（暂未实现）
        alert('支付宝支付暂未开通，请使用微信支付');
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      alert('创建订单失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 开始轮询查询支付状态
  const startPolling = (orderNo: string) => {
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`https://semopic.com/api/wechat/query-order/${orderNo}`);
        const data = await response.json();

        if (data.success && data.paid && !isPaymentProcessed) {
          // 支付成功，立即标记已处理
          setIsPaymentProcessed(true);
          
          // 立即停止轮询
          if (pollingTimer) {
            clearInterval(pollingTimer);
            setPollingTimer(null);
          }
          clearInterval(timer);
          
          const totalCredits = selectedPkg!.credits + selectedPkg!.bonus;
          
          // 关闭弹窗并通知父组件
          onRecharge(selectedPkg!.price, totalCredits, '微信支付');
          handleClose();
          
          // 延迟显示成功提示，避免弹窗被关闭时提示看不到
          setTimeout(() => {
            alert(`✅ 支付成功！\n获得 ${totalCredits} 积分`);
          }, 100);
        }
      } catch (error) {
        console.error('查询订单失败:', error);
      }
    }, 3000); // 每3秒查询一次

    setPollingTimer(timer);
  };

  // 获取套餐ID
  const getPackageId = (id: number): string => {
    const mapping: Record<number, string> = {
      1: 'small',
      2: 'medium',
      3: 'large',
      4: 'super',
    };
    return mapping[id] || 'small';
  };

  // 关闭弹窗
  const handleClose = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      setPollingTimer(null);
    }
    setQrCodeUrl('');
    setOrderNo('');
    setShowQrCode(false);
    setSelectedPackage(null);
    setIsPaymentProcessed(false);
    onClose();
  };

  return (
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
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 显示二维码 */}
          {showQrCode && qrCodeUrl && (
            <div className="tech-card p-6 mb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="text-tech" size={20} />
                <h3 className="text-lg font-semibold text-slate-900">请使用微信扫码支付</h3>
              </div>
              
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <QRCodeSVG 
                  value={qrCodeUrl} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <p className="text-sm text-slate-600 mb-2">
                订单号：{orderNo}
              </p>
              <p className="text-xs text-slate-500">
                支付后将自动充值，请勿关闭此页面
              </p>
              
              <div className="flex items-center justify-center gap-2 mt-4 text-slate-500">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">等待支付中...</span>
              </div>
            </div>
          )}

          {/* 套餐选择（未生成二维码时显示） */}
          {!showQrCode && (
            <>
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
                        <span className="text-slate-900 font-bold ml-1">300</span>
                      </div>
                      <div className="bg-white rounded px-2 py-1.5 border border-slate-200">
                        <span className="text-slate-600 font-medium">生成视频：</span>
                        <span className="text-slate-900 font-bold ml-1">700</span>
                      </div>
                      <div className="bg-white rounded px-2 py-1.5 border border-slate-200">
                        <span className="text-slate-600 font-medium">完整流程：</span>
                        <span className="text-slate-900 font-bold ml-1">1000</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">
                      10元 = 1000积分 • 积分永久有效 • 多充多送
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
                    disabled
                    className={cn(
                      "tech-card p-3 flex items-center gap-3 transition-all opacity-50 cursor-not-allowed"
                    )}
                  >
                    <CreditCard size={20} className="text-slate-400" />
                    <span className="font-medium text-sm">支付宝（暂未开通）</span>
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
            </>
          )}
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
          
          {!showQrCode && (
            <button
              onClick={handleRecharge}
              disabled={!selectedPkg || isProcessing}
              className="btn-tech-ai w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '处理中...' : '确认充值'}
            </button>
          )}
          
          {showQrCode && (
            <button
              onClick={handleClose}
              className="btn-tech-secondary w-full py-3"
            >
              取消支付
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
