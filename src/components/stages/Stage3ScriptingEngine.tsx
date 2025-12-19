import React, { useState } from 'react';
import { useFormStore } from '../../lib/store';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Wand2, Edit3, Save, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function Stage3ScriptingEngine() {
  const { script, productInfo, directorSettings, generateScriptWithAI, modifyScript, updateScript } = useFormStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // AI导演辅助生成脚本
  const handleGenerateScript = async () => {
    setIsGenerating(true);
    try {
      await generateScriptWithAI();
      toast.success('AI脚本生成成功！您可以继续修改');
    } catch (error) {
      toast.error('AI脚本生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存镜头修改
  const handleSaveShot = (index: number, updates: any) => {
    modifyScript(index, updates);
    setEditingIndex(null);
    toast.success('镜头已更新');
  };

  return (
    <div className="h-full flex bg-[#0a0a0a]">
      {/* 左侧：AI导演辅助 */}
      <div className="w-96 border-r border-gray-800 bg-[#141414] p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <h3 className="text-xl font-bold text-white">AI Director</h3>
          </div>
          <p className="text-sm text-gray-400">
            Auto-generate script based on your product info and settings
          </p>
        </div>

        {/* 显著的AI生成按钮 */}
        <Button
          onClick={handleGenerateScript}
          disabled={isGenerating || productInfo.productImages.length !== 5}
          className="w-full h-16 text-lg font-bold shadow-2xl transition-all bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl"
          size="lg"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Script
            </>
          )}
        </Button>

        {/* 配置信息展示 */}
        <div className="p-5 bg-[#0a0a0a] rounded-xl border border-gray-800 space-y-3">
          <Label className="text-sm font-semibold text-white">Config</Label>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Product:</span>
              <span className="font-medium text-white truncate max-w-[150px]" title={productInfo.productName}>
                {productInfo.productName || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Images:</span>
              <span className="font-medium text-white">{productInfo.productImages.length}/5</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Selling Points:</span>
              <span className="font-medium text-white">{productInfo.sellingPoints.length}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Language:</span>
              <span className="font-medium text-white">
                {directorSettings.language === 'zh-CN' ? '中文' :
                 directorSettings.language === 'en-US' ? 'English' :
                 directorSettings.language === 'id-ID' ? 'Indonesia' : 'Tiếng Việt'}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Duration:</span>
              <span className="font-medium text-white">{directorSettings.duration}s</span>
            </div>
          </div>
        </div>

        {/* 核心卖点展示 */}
        {productInfo.sellingPoints.length > 0 && (
          <div className="p-5 bg-[#0a0a0a] rounded-xl border border-gray-800 space-y-3">
            <Label className="text-sm font-semibold text-white">Selling Points</Label>
            <div className="space-y-2">
              {productInfo.sellingPoints.map((point, index) => (
                <div key={index} className="text-xs text-gray-400 flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">{index + 1}.</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI生成状态提示 */}
        {script.isGenerated && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Script Generated</span>
            </div>
            <p className="text-xs text-green-400/80 mt-1">
              {script.shots.length} shots · {script.aiAssisted ? 'AI-assisted' : 'Manual'}
            </p>
          </div>
        )}
      </div>

      {/* 右侧：脚本编辑器 */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a] text-white">
        <div className="max-w-5xl mx-auto px-8 py-12 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold">Script Creation</h2>
            <p className="text-gray-400">
              AI-generated script with instant editing
            </p>
          </div>

          {/* 脚本为空时的提示 */}
          {script.shots.length === 0 ? (
            <div className="p-16 text-center">
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto">
                  <Wand2 className="w-10 h-10 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white">No script yet</h3>
                <p className="text-gray-400">
                  Click the "Generate Script" button to let AI create a script based on your product
                </p>
              </div>
            </div>
          ) : (
          <>
            {/* 镜头列表 */}
            <div className="space-y-4">
              {script.shots.map((shot, index) => (
                <ShotEditor
                  key={index}
                  shot={shot}
                  index={index}
                  productImages={productInfo.productImages}
                  isEditing={editingIndex === index}
                  onEdit={() => setEditingIndex(index)}
                  onSave={(updates) => handleSaveShot(index, updates)}
                  onCancel={() => setEditingIndex(null)}
                />
              ))}
            </div>

            {/* 底部按钮 */}
            <div className="flex justify-center gap-4 pt-8">
              <Button
                variant="outline"
                onClick={() => useFormStore.getState().prevStage()}
                className="bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl px-8 h-12"
              >
                ← Back
              </Button>
              <Button
                size="lg"
                onClick={() => useFormStore.getState().nextStage()}
                disabled={!script.isGenerated || script.shots.length === 0}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-xl px-12 h-12 shadow-lg shadow-yellow-400/30 disabled:bg-gray-800 disabled:text-gray-600 disabled:shadow-none"
              >
                Continue to Rendering →
              </Button>
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

// 镜头编辑器组件
function ShotEditor({
  shot,
  index,
  productImages,
  isEditing,
  onEdit,
  onSave,
  onCancel,
}: {
  shot: any;
  index: number;
  productImages: string[];
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: any) => void;
  onCancel: () => void;
}) {
  const [editedShot, setEditedShot] = useState(shot);

  React.useEffect(() => {
    setEditedShot(shot);
  }, [shot, isEditing]);

  if (isEditing) {
    return (
      <div className="p-6 bg-[#141414] border-2 border-yellow-400 rounded-2xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-white">Edit Shot {index + 1}</Label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onCancel} className="bg-transparent border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button size="sm" onClick={() => onSave(editedShot)} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`time-${index}`} className="text-sm text-gray-400">Timeline</Label>
              <Input
                id={`time-${index}`}
                value={editedShot.time}
                onChange={(e) => setEditedShot({ ...editedShot, time: e.target.value })}
                placeholder="e.g., 0-3s"
                className="bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`emotion-${index}`} className="text-sm text-gray-400">Emotion</Label>
              <Input
                id={`emotion-${index}`}
                value={editedShot.emotion}
                onChange={(e) => setEditedShot({ ...editedShot, emotion: e.target.value })}
                placeholder="e.g., Curious, Excited"
                className="bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`scene-${index}`} className="text-sm text-gray-400">Scene</Label>
            <Textarea
              id={`scene-${index}`}
              value={editedShot.scene}
              onChange={(e) => setEditedShot({ ...editedShot, scene: e.target.value })}
              rows={2}
              className="bg-[#0a0a0a] border-gray-800 text-white resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`action-${index}`} className="text-sm text-gray-400">Action</Label>
            <Textarea
              id={`action-${index}`}
              value={editedShot.action}
              onChange={(e) => setEditedShot({ ...editedShot, action: e.target.value })}
              rows={2}
              className="bg-[#0a0a0a] border-gray-800 text-white resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`audio-${index}`} className="text-sm text-gray-400">Script</Label>
            <Textarea
              id={`audio-${index}`}
              value={editedShot.audio}
              onChange={(e) => setEditedShot({ ...editedShot, audio: e.target.value })}
              rows={3}
              className="bg-[#0a0a0a] border-gray-800 text-white resize-none"
            />
          </div>

          {/* 图片选择 */}
          {productImages.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Related Image</Label>
              <div className="flex gap-2">
                {productImages.map((img, imgIndex) => (
                  <button
                    key={imgIndex}
                    onClick={() => setEditedShot({ ...editedShot, imageIndex: imgIndex })}
                    className={`w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                      editedShot.imageIndex === imgIndex
                        ? 'border-yellow-400 ring-2 ring-yellow-400/30'
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <img src={img} alt={`Image ${imgIndex + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#141414] border border-gray-800 hover:border-gray-700 rounded-2xl transition-all">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400/10 border border-yellow-400/30 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-yellow-400">{index + 1}</span>
              </div>
              <div>
                <Label className="text-base font-semibold text-white">Shot {index + 1}</Label>
                <p className="text-xs text-gray-500">{shot.time} · {shot.emotion}</p>
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onEdit} className="bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white">
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>

        <div className="grid gap-3">
          <div>
            <Label className="text-xs text-gray-500">Scene</Label>
            <p className="text-sm text-gray-200 mt-1">{shot.scene}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Action</Label>
            <p className="text-sm text-gray-200 mt-1">{shot.action}</p>
          </div>
          <div className="p-4 bg-yellow-400/5 rounded-xl border border-yellow-400/20">
            <Label className="text-xs text-yellow-400 font-medium">Script</Label>
            <p className="text-sm text-gray-200 mt-1 italic">"{shot.audio}"</p>
          </div>
        </div>

        {/* 关联图片预览 */}
        {shot.imageIndex !== undefined && productImages[shot.imageIndex] && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
            <img
              src={productImages[shot.imageIndex]}
              alt={`Image ${shot.imageIndex + 1}`}
              className="w-12 h-12 object-cover rounded-lg border border-gray-700"
            />
            <span className="text-xs text-gray-500">Using image {shot.imageIndex + 1}</span>
          </div>
        )}
      </div>
    </div>
  );
}
