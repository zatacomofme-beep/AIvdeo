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
      credits: 1000, 
      price: 10, 
      label: '入门套餐',
      bonus: 0,
      popular: false
    },
    { 
      id: 2, 
      credits: 5000, 
      price: 49, 
      label: '进阶套餐',
      bonus: 0,
      popular: true
    },
    { 
      id: 3, 
      credits: 12000, 
      price: 99, 
      label: '专业套餐',
      bonus: 0,
      popular: false
    },
    { 
      id: 4, 
      credits: 23000, 
      price: 199, 
      label: '企业套餐',
      bonus: 0,
      popular: false
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
      alert(`✅ 充值成功！\n获得 ${totalCredits} Credits`);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[700px] max-h-[90vh] bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-md shadow-yellow-500/20">
              <Zap className="text-white" size={18} />
            </div>
            <h2 className="font-semibold text-lg text-slate-800">充值 Credits</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Zap className="text-yellow-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-yellow-700 font-bold mb-2">
                  ✨ Credits 使用说明
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/60 rounded px-2 py-1.5">
                    <span className="text-yellow-700 font-bold">生成脚本</span>
                    <span className="text-yellow-600 ml-2">30 Credits/次</span>
                  </div>
                  <div className="bg-white/60 rounded px-2 py-1.5">
                    <span className="text-yellow-700 font-bold">生成视频</span>
                    <span className="text-yellow-600 ml-2">70 Credits/次</span>
                  </div>
                  <div className="bg-white/60 rounded px-2 py-1.5 col-span-2">
                    <span className="text-yellow-700 font-bold">完整流程</span>
                    <span className="text-yellow-600 ml-2">100 Credits/个视频</span>
                  </div>
                </div>
                <p className="text-xs text-yellow-600/80 mt-2">
                  • 10元 = 1000点 | • Credits 永久有效，无过期时间
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
                      <span className="text-base font-bold text-slate-900">{pkg.credits.toLocaleString()} Credits</span>
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
                <span className="text-sm text-slate-600">获得 Credits</span>
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
