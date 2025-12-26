import React, { useState } from 'react';
import { MessageSquare, Copy, Trash2, Clock, Sparkles, X, Eye } from 'lucide-react';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function MyPrompts() {
  const { myPrompts, deletePrompt } = useStore();
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('提示词已复制到剪贴板');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      <div className="p-8 pb-4 border-b border-slate-200">
        <h2 className="text-3xl font-semibold text-slate-900 flex items-center gap-3">
          <MessageSquare className="text-tech" size={32} />
          我的提示词
          <span className="badge-tech ml-2">
            {myPrompts.length}
          </span>
        </h2>
        <p className="text-slate-600 mt-2 text-sm">保存和管理您的优质视频脚本与提示词</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar bg-slate-50">
        {myPrompts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center mb-4 border border-slate-200">
              <MessageSquare size={40} className="text-slate-300" />
            </div>
            <p className="text-lg text-slate-600">暂无提示词</p>
            <p className="text-sm mt-2">在生成脚本时可以保存您满意的结果</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {myPrompts.map((prompt) => (
              <div 
                key={prompt.id} 
                onClick={() => setSelectedPrompt(prompt)}
                className="tech-card group flex flex-col overflow-hidden hover:shadow-tech-md transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-md bg-tech-light/30 flex items-center justify-center text-tech shrink-0 border border-tech/20">
                      <Sparkles size={16} />
                    </div>
                    <span className="font-medium text-slate-900 truncate text-sm">
                      {prompt.productName || '未命名项目'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPrompt(prompt);
                      }}
                      className="p-1.5 text-slate-400 hover:text-tech hover:bg-tech-light/20 rounded-md transition-colors"
                      title="查看详情"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(prompt.content);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="复制"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePrompt(prompt.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="p-4 flex-1">
                  <div className="h-32 overflow-hidden relative">
                    <p className="text-slate-600 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                      {prompt.content}
                    </p>
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                  <Clock size={12} />
                  保存于 {formatDate(prompt.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 详情模态框 */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-[800px] max-h-[90vh] tech-card flex flex-col overflow-hidden bg-white">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-tech rounded-md flex items-center justify-center shadow-tech-sm text-white">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-slate-900">
                    {selectedPrompt.productName || '未命名项目'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <Clock size={12} />
                    保存于 {formatDate(selectedPrompt.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50">
              <div className="bg-white rounded-md p-6 border border-slate-200">
                <pre className="text-slate-700 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {selectedPrompt.content}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="h-16 flex items-center justify-between px-6 border-t border-slate-200 shrink-0 bg-white">
              <div className="text-sm text-slate-500">
                字数：{selectedPrompt.content.length}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCopy(selectedPrompt.content)}
                  className="btn-tech-ai px-6 py-2.5 flex items-center gap-2"
                >
                  <Copy size={16} />
                  复制提示词
                </button>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
