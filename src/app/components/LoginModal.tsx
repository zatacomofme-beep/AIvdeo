import React, { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from '../../lib/toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, username: string, verificationCode: string) => void;
}

export function LoginModal({ isOpen, onClose, onLogin, onRegister }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // 新增：确认密码
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 新增：显示确认密码
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 当弹窗关闭时，重置状态
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setEmail('');
      setPassword('');
      setConfirmPassword(''); // 重置确认密码
      setUsername('');
      setVerificationCode('');
      setShowPassword(false);
      setShowConfirmPassword(false); // 重置显示状态
      setCountdown(0);
    }
  }, [isOpen]);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!email) {
      toast.warning('请先输入邮箱');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.warning('请输入有效的邮箱地址');
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await fetch('https://semopic.com/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('验证码已发送到您的邮箱');
        setCountdown(60); // 60秒倒计时
      } else {
        toast.error(data.detail || '发送失败，请稍后重试');
      }
    } catch (error) {
      toast.error('网络错误，请检查网络连接');
    } finally {
      setIsSendingCode(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 注册时验证验证码
    if (mode === 'register') {
      if (!verificationCode) {
        toast.warning('请输入邮箱验证码');
        return;
      }
      if (verificationCode.length !== 6) {
        toast.warning('验证码应为6位数字');
        return;
      }
      // 新增：验证密码一致性
      if (password !== confirmPassword) {
        toast.warning('两次输入的密码不一致');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        // 注册时传入验证码
        await onRegister(email, password, username, verificationCode);
      }
      // 注意：不在这里清空表单，由 useEffect 在弹窗关闭时处理
    } catch (error) {
      // 如果出错，重置 loading 状态
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="w-[450px] tech-card shadow-tech-lg rounded-lg border border-slate-200 bg-white overflow-hidden relative">
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-xl text-slate-800 tracking-wide">
            {mode === 'login' ? '欢迎回来' : '创建账号'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5 relative z-10">
          {/* Username (Register only) */}
          {mode === 'register' && (
            <div className="animate-in slide-in-from-left-2 duration-300">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                用户名 <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tech transition-colors" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-tech focus:ring-2 focus:ring-tech/20 transition-all hover:border-slate-300"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="animate-in slide-in-from-left-2 duration-300 delay-75">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              邮箱 <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tech transition-colors" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-tech focus:ring-2 focus:ring-tech/20 transition-all hover:border-slate-300"
              />
            </div>
          </div>

          {/* 验证码 (Register only) */}
          {mode === 'register' && (
            <div className="animate-in slide-in-from-left-2 duration-300 delay-100">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                邮箱验证码 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative group flex-1">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="请输入6位验证码"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-tech focus:ring-2 focus:ring-tech/20 transition-all hover:border-slate-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode || countdown > 0}
                  className={cn(
                    "px-4 py-3 rounded-md font-medium whitespace-nowrap transition-all flex items-center gap-2",
                    isSendingCode || countdown > 0
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg"
                  )}
                >
                  {isSendingCode ? (
                    <>发送中...</>
                  ) : countdown > 0 ? (
                    <>{countdown}秒</>
                  ) : (
                    <>
                      <Send size={16} />
                      发送验证码
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 ml-1">验证码已发送至您的邮箱，请注意查收</p>
            </div>
          )}

          {/* Password */}
          <div className="animate-in slide-in-from-left-2 duration-300 delay-150">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tech transition-colors" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                minLength={6}
                className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-tech focus:ring-2 focus:ring-tech/20 transition-all hover:border-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === 'register' && (
              <p className="text-xs text-slate-500 mt-2 ml-1">密码长度至少6位</p>
            )}
          </div>

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <div className="animate-in slide-in-from-left-2 duration-300 delay-200">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tech transition-colors" size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  required
                  minLength={6}
                  className={cn(
                    "w-full pl-10 pr-12 py-3 bg-white border rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all hover:border-slate-300",
                    confirmPassword && password !== confirmPassword
                      ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                      : "border-slate-200 focus:border-tech focus:ring-tech/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-2 ml-1">❗ 两次输入的密码不一致</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600 mt-2 ml-1">✅ 密码输入一致</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 animate-in slide-in-from-bottom-2 duration-300 delay-200">
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-3.5 rounded-md font-semibold transition-all shadow-sm",
                isLoading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "btn-tech-ai"
              )}
            >
              {isLoading ? '处理中...' : mode === 'login' ? '立即登录' : '立即注册'}
            </button>
          </div>

          {/* Switch Mode */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setEmail('');
                setPassword('');
                setConfirmPassword(''); // 重置确认密码
                setUsername('');
                setVerificationCode('');
              }}
              className="text-sm text-slate-500 hover:text-tech transition-colors font-medium"
            >
              {mode === 'login' ? '还没有账号？立即注册' : '已有账号？立即登录'}
            </button>
          </div>
        </form>

        {/* Footer */}
        {mode === 'register' && (
          <div className="px-8 pb-8 relative z-10 animate-in fade-in duration-500">
            <div className="bg-sky-50 border border-sky-200 rounded-md p-4 flex items-center justify-center gap-2">
              <span className="text-xl">🎁</span>
              <p className="text-sm text-sky-700">
                新用户注册即送 <span className="font-bold text-tech text-base">100 Credits</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
