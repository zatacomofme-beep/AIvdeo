import React, { useState } from 'react';
import { X, Zap, Check, CreditCard, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecharge: (amount: number, credits: number, method: string) => void;
}

export function RechargeModal({ isOpen, onClose, onRecharge }: RechargeModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('alipay');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const packages = [
    { 
      id: 1, 
      credits: 100, 
      price: 10, 
      label: '小额充值',
      bonus: 0,
      popular: false,
      icon: '💳',
      desc: '新手入门'
    },
    { 
      id: 2, 
      credits: 520, 
      price: 49, 
      label: '标准充倽',
      bonus: 20,
      popular: true,
      icon: '⭐',
      desc: '最受欢迎'
    },
    { 
      id: 3, 
      credits: 1100, 
      price: 99, 
      label: '超值充值',
      bonus: 100,
      popular: false,
      icon: '🚀',
      desc: '额外赠送10%'
    },
    { 
      id: 4, 
      credits: 5800, 
      price: 499, 
      label: '高级充值',
      bonus: 800,
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

    setIsProcessing(true);
    
    // 模拟支付处理
    setTimeout(() => {
      const totalCredits = selectedPkg.credits + selectedPkg.bonus;
      onRecharge(selectedPkg.price, totalCredits, paymentMethod === 'alipay' ? '支付宝' : '微信支付');
      setIsProcessing(false);
      onClose();
      alert(`✅ 充值成功！\n获得 ${totalCredits} 积分`);
    }, 2000);
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
                  10元 = 100积分 • 积分永久有效 • 多充多送
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
  );
}
