import React from 'react';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenContact: () => void;
}

export function Footer({ onOpenPrivacy, onOpenTerms, onOpenContact }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/60 bg-white/40 backdrop-blur-md py-4">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between text-sm text-slate-600">
          {/* 左侧：版权和备案信息 */}
          <div className="flex items-center gap-2">
            <span>© {currentYear} semopic-一站式内容平台</span>
            <span className="text-slate-400">|</span>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              蜀ICP备2025170225号
            </a>
          </div>

          {/* 右侧：链接 */}
          <div className="flex items-center gap-6">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-slate-900 transition-colors"
            >
              隐私政策
            </button>
            <button
              onClick={onOpenTerms}
              className="hover:text-slate-900 transition-colors"
            >
              服务条款
            </button>
            <button
              onClick={onOpenContact}
              className="hover:text-slate-900 transition-colors"
            >
              联系我们
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
