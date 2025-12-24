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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/30">
      <div className="p-8 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <MessageSquare className="text-purple-600" />
          我的提示词
          <span className="text-sm font-normal text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
            {myPrompts.length}
          </span>
        </h2>
        <p className="text-slate-500 mt-2 text-sm">保存和管理您的优质视频脚本与提示词</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
        {myPrompts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
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
                className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-purple-400/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/5 cursor-pointer"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 border border-purple-200">
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
                      className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(prompt.content);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
                      title="复制"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePrompt(prompt.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="w-[800px] max-h-[90vh] glass-card flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-white/60 bg-white/90">
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-8 border-b border-slate-100 shrink-0 bg-white/60 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20 text-white">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-slate-800">
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
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <pre className="text-slate-700 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {selectedPrompt.content}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="h-20 flex items-center justify-between px-8 border-t border-slate-100 shrink-0 bg-white/60 backdrop-blur-md">
              <div className="text-sm text-slate-500">
                字数：{selectedPrompt.content.length}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCopy(selectedPrompt.content)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all shadow-md shadow-purple-500/20 hover:shadow-purple-500/40"
                >
                  <Copy size={16} />
                  复制提示词
                </button>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
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
