import React from 'react';
import { X, Mail, Globe, MessageCircle } from 'lucide-react';

interface ContactUsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactUs({ isOpen, onClose }: ContactUsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">联系我们</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-8">
          <p className="text-slate-700 mb-8 text-center">
            感谢您使用semopic-一站式内容平台！我们随时准备为您提供帮助。
          </p>

          <div className="space-y-6">
            {/* 客服邮箱 */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">客服邮箱</h3>
                <p className="text-slate-600 text-sm mb-2">
                  遇到问题或有建议？发送邮件给我们
                </p>
                <a
                  href="mailto:semopic@163.com"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  semopic@163.com
                </a>
              </div>
            </div>

            {/* 商务合作 */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">商务合作</h3>
                <p className="text-slate-600 text-sm mb-2">
                  期待与您探讨合作机会
                </p>
                <a
                  href="mailto:semopicb@163.com"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  semopicb@163.com
                </a>
              </div>
            </div>

            {/* 官方网站 */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="p-3 bg-green-100 rounded-lg">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">官方网站</h3>
                <p className="text-slate-600 text-sm mb-2">
                  访问我们的官网了解更多
                </p>
                <a
                  href="https://semopic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  https://semopic.com
                </a>
              </div>
            </div>
          </div>

          {/* 工作时间 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-slate-900 mb-2">服务时间</h4>
            <p className="text-slate-700 text-sm">
              工作日：9:00 - 18:00（北京时间）<br />
              我们会在1个工作日内回复您的邮件
            </p>
          </div>

          {/* 常见问题提示 */}
          <div className="mt-6 p-4 border border-slate-200 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">联系前请准备</h4>
            <ul className="text-slate-700 text-sm space-y-1">
              <li>• 您的账户邮箱（如涉及账户问题）</li>
              <li>• 问题的详细描述和截图</li>
              <li>• 您希望得到的帮助或解决方案</li>
            </ul>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
