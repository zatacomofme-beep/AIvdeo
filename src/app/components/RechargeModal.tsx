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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/60 via-purple-900/40 to-blue-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="w-[850px] max-h-[90vh] bg-white/95 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl shadow-purple-500/20 flex flex-col overflow-hidden">
        {/* Header with Gradient */}
        <div className="relative h-24 flex items-center justify-between px-8 border-b border-white/20 shrink-0 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30" />
            
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 text-white text-3xl">
              ⚡
            </div>
            <div>
              <h2 className="font-black text-2xl text-slate-900">充值中心</h2>
              <p className="text-sm text-slate-500 mt-0.5">选择套餐，释放创意</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative p-3 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-xl transition-all hover:scale-110"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-50/50 via-purple-50/30 to-blue-50/30">
          {/* Info Banner with Glass Effect */}
          <div className="relative bg-gradient-to-r from-yellow-400/20 via-amber-400/20 to-orange-400/20 backdrop-blur-sm border border-yellow-300/40 rounded-2xl p-6 mb-8 overflow-hidden shadow-lg shadow-yellow-500/10">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="relative flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30 shrink-0 text-3xl">
                💡
              </div>
              <div className="flex-1">
                <p className="text-base text-yellow-900 font-bold mb-3">
                  ✨ 积分使用说明
                </p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-yellow-700 font-bold text-xs mb-1">生成脚本</div>
                    <div className="text-yellow-600 font-semibold">30 积分</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-yellow-700 font-bold text-xs mb-1">生成视频</div>
                    <div className="text-yellow-600 font-semibold">70 积分</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-yellow-700 font-bold text-xs mb-1">完整流程</div>
                    <div className="text-yellow-600 font-semibold">100 积分</div>
                  </div>
                </div>
                <p className="text-xs text-yellow-700/80 mt-3 flex items-center gap-2">
                  <span>• 10元 = 100积分</span>
                  <span>• 积分永久有效</span>
                  <span>• 多充多送</span>
                </p>
              </div>
            </div>
          </div>

          {/* Packages */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">选择充值套餐</h3>
            <div className="grid grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={cn(
                    "relative p-4 border-2 rounded-lg transition-all text-left shadow-sm hover:shadow-md",
                    selectedPackage === pkg.id
                      ? "border-yellow-400 bg-yellow-50 shadow-yellow-500/10"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 right-4 px-3 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold rounded-full shadow-sm">
                      推荐
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-sm text-slate-500 mb-1 font-medium">{pkg.label}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">¥{pkg.price}</span>
                      </div>
                    </div>
                    {selectedPackage === pkg.id && (
                      <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm shrink-0">
                        <Check className="text-white" size={14} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Zap className="text-yellow-500" size={16} />
                      <span className="text-base font-bold text-slate-900">{pkg.credits.toLocaleString()} 积分</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">支付方式</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('alipay')}
                className={cn(
                  "p-4 border-2 rounded-lg transition-all flex items-center gap-3 shadow-sm",
                  paymentMethod === 'alipay'
                    ? "border-yellow-400 bg-yellow-50 shadow-yellow-500/10"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <CreditCard className="text-white" size={20} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-slate-900">支付宝</div>
                  <div className="text-xs text-slate-500">推荐使用</div>
                </div>
                {paymentMethod === 'alipay' && (
                  <Check className="text-yellow-500" size={20} />
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('wechat')}
                className={cn(
                  "p-4 border-2 rounded-lg transition-all flex items-center gap-3 shadow-sm",
                  paymentMethod === 'wechat'
                    ? "border-yellow-400 bg-yellow-50 shadow-yellow-500/10"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Smartphone className="text-white" size={20} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-slate-900">微信支付</div>
                  <div className="text-xs text-slate-500">扫码支付</div>
                </div>
                {paymentMethod === 'wechat' && (
                  <Check className="text-yellow-500" size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          {selectedPkg && (
            <div className="mt-6 bg-gradient-to-br from-white to-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-yellow-100">
                <span className="text-sm text-slate-600">充值金额</span>
                <span className="text-2xl font-bold text-slate-900">¥{selectedPkg.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">获得积分</span>
                <span className="text-xl font-bold text-yellow-600">
                  {selectedPkg.credits.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-6 bg-white">
          <button
            onClick={handleRecharge}
            disabled={!selectedPkg || isProcessing}
            className={cn(
              "w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
              !selectedPkg || isProcessing
                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-white shadow-yellow-500/20 hover:shadow-yellow-500/30 transform hover:-translate-y-0.5"
            )}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Zap size={18} />
                {selectedPkg ? `支付 ¥${selectedPkg.price}` : '请选择套餐'}
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 text-center mt-3">
            支付即表示同意《用户协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
}
