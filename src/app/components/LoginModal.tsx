import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, username: string) => void;
}

export function LoginModal({ isOpen, onClose, onLogin, onRegister }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 当弹窗关闭时，重置状态
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setEmail('');
      setPassword('');
      setUsername('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, username);
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
                setUsername('');
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
