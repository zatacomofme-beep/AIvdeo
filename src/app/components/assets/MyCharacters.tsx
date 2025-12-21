import React, { useState } from 'react';
import { Users, Plus, Trash2, Clock, Edit, X, Wand2, Loader2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';
const API_BASE_URL = 'http://115.190.137.87:8000';

export function MyCharacters() {
  const { myCharacters, addCharacter, deleteCharacter } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [formData, setFormData] = useState({
    country: '', // 国家
    ethnicity: '', // 人种
    name: '',
    description: '',
    age: '',
    gender: '',
    style: '',
    tags: ''
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAIGenerate = async () => {
    // 检查是否填写了4个必须参数
    if (!formData.country || !formData.ethnicity || !formData.age || !formData.gender) {
      alert('请先填写国家、人种、年龄和性别！');
      return;
    }

    setIsGeneratingAI(true);
    try {
      // 调用 GPT-4 API 生成角色信息，传入4个参数
      const response = await fetch(`${API_BASE_URL}/api/generate-character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          country: formData.country,
          ethnicity: formData.ethnicity,
          age: parseInt(formData.age),
          gender: formData.gender
        }),
      });

      if (!response.ok) {
        throw new Error('AI生成失败');
      }

      const data = await response.json();
      console.log('AI生成返回的数据:', data);
      
      // 解析AI生成的结果并填充表单（保疙4个输入参数）
      setFormData({
        ...formData, // 保留国家、人种、年龄、性别
        name: data.name || '',
        description: data.description || '',
        style: data.style || '',
        tags: data.tags?.join(', ') || ''
      });
      
      console.log('表单数据已更新:', {
        country: formData.country,
        ethnicity: formData.ethnicity,
        age: formData.age,
        gender: formData.gender,
        name: data.name,
        description: data.description,
        style: data.style,
        tags: data.tags
      });
      
      alert('✅ AI生成成功！请检查并修改信息。');
    } catch (error) {
      console.error('AI生成角色失败:', error);
      alert('❌ AI生成失败，请稍后重试');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      alert('请填写角色名称和描述');
      return;
    }

    // 开始创建，显示加载状态
    setIsGeneratingAI(true);
    
    try {
      // 调用后端API创建Sora2角色
      const response = await fetch(`${API_BASE_URL}/create-character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          age: formData.age ? parseInt(formData.age) : undefined,
          gender: formData.gender || undefined,
          style: formData.style || undefined,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '创建失败' }));
        throw new Error(errorData.detail || '创建角色失败');
      }

      const result = await response.json();
      console.log('角色创建成功:', result);

      // 保存到本地store（不需要头像）
      addCharacter({
        name: formData.name,
        description: formData.description,
        avatar: '', // 不使用头像
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        style: formData.style || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        characterId: result.character_id // 保存Sora角色ID
      });

      setFormData({
        country: '',
        ethnicity: '',
        name: '',
        description: '',
        age: '',
        gender: '',
        style: '',
        tags: ''
      });
      setShowCreateModal(false);
      
      // 显示成功提示
      alert(`✅ 角色创建成功！\n\n角色ID: ${result.character_id}`);
      
    } catch (error) {
      console.error('创建角色失败:', error);
      alert(`❌ 创建角色失败\n\n${error instanceof Error ? error.message : '请稍后重试'}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/30">
      <div className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="text-purple-600" />
              我的角色
              <span className="text-sm font-normal text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                {myCharacters.length}
              </span>
            </h2>
            <p className="text-slate-500 mt-2 text-sm">管理您创建的所有虚拟角色</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-md shadow-purple-500/20 hover:shadow-purple-500/30"
          >
            <Plus size={18} />
            创建角色
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
        {myCharacters.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
              <Users size={40} className="text-slate-300" />
            </div>
            <p className="text-lg text-slate-600">暂无角色</p>
            <p className="text-sm mt-2">创建您的第一个虚拟角色</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myCharacters.map((character) => (
              <div 
                key={character.id} 
                className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-purple-400/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10"
              >
                {/* Avatar Container - 使用首字母头像 */}
                <div className="aspect-[3/4] relative bg-gradient-to-br from-purple-400 to-pink-400">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl font-bold text-white">
                      {character.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white text-sm line-clamp-3">{character.description}</p>
                  </div>

                  {/* Top Actions */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => deleteCharacter(character.id)}
                      className="p-2 bg-white/90 backdrop-blur-md text-red-500 hover:text-red-600 rounded-lg hover:bg-white transition-colors shadow-sm"
                      title="删除角色"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Tags */}
                  {character.tags && character.tags.length > 0 && (
                    <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                      {character.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-1 bg-white/90 backdrop-blur-md text-slate-700 rounded-md font-medium shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 border-t border-slate-100 bg-white">
                  <h3 className="font-bold text-slate-800 truncate mb-2" title={character.name}>
                    {character.name}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    {character.gender && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded">
                        {character.gender}
                      </span>
                    )}
                    {character.age && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded">
                        {character.age}岁
                      </span>
                    )}
                  </div>

                  {character.style && (
                    <div className="text-xs text-slate-600 mb-2 px-2 py-1 bg-purple-50 rounded inline-block">
                      {character.style}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(character.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Character Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plus className="text-purple-600" size={24} />
                创建新角色
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAIGenerate}
                  disabled={isGeneratingAI}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="使用AI生成角色信息"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      生成中
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} />
                      AI生成
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 国家、人种、年龄、性别 - 先填写这4个参数 */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Wand2 size={16} />
                  请先填写以下4个参数，然后点击"AI生成"
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      国家 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">请选择国家</option>
                      <option value="中国">中国</option>
                      <option value="美国">美国</option>
                      <option value="日本">日本</option>
                      <option value="韩国">韩国</option>
                      <option value="英国">英国</option>
                      <option value="法国">法国</option>
                      <option value="德国">德国</option>
                      <option value="意大利">意大利</option>
                      <option value="西班牙">西班牙</option>
                      <option value="俄罗斯">俄罗斯</option>
                      <option value="印度">印度</option>
                      <option value="巴西">巴西</option>
                      <option value="澳大利亚">澳大利亚</option>
                      <option value="加拿大">加拿大</option>
                      <option value="泰国">泰国</option>
                      <option value="越南">越南</option>
                      <option value="印度尼西亚">印度尼西亚</option>
                      <option value="菲律宾">菲律宾</option>
                      <option value="马来西亚">马来西亚</option>
                      <option value="新加坡">新加坡</option>
                      <option value="土耳其">土耳其</option>
                      <option value="沙特阿拉伯">沙特阿拉伯</option>
                      <option value="阿联酋">阿联酋</option>
                      <option value="埃及">埃及</option>
                      <option value="南非">南非</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      人种 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.ethnicity}
                      onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">请选择人种</option>
                      <optgroup label="东亚">
                        <option value="中国人">中国人</option>
                        <option value="日本人">日本人</option>
                        <option value="韩国人">韩国人</option>
                      </optgroup>
                      <optgroup label="东南亚">
                        <option value="越南人">越南人</option>
                        <option value="印尼人">印尼人（印度尼西亚）</option>
                        <option value="泰国人">泰国人</option>
                        <option value="菲律宾人">菲律宾人</option>
                        <option value="马来人">马来人（马来西亚/新加坡）</option>
                      </optgroup>
                      <optgroup label="南亚">
                        <option value="印度人">印度人</option>
                        <option value="巴基斯坦人">巴基斯坦人</option>
                      </optgroup>
                      <optgroup label="欧美">
                        <option value="白人">白人（欧洲/北美）</option>
                        <option value="拉丁裔">拉丁裔（南美/中美）</option>
                        <option value="黑人">黑人（非洲/美洲）</option>
                      </optgroup>
                      <optgroup label="中东">
                        <option value="阿拉伯人">阿拉伯人</option>
                        <option value="土耳其人">土耳其人</option>
                      </optgroup>
                      <optgroup label="其他">
                        <option value="混血">混血</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      年龄 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="例如：28"
                      min="18"
                      max="80"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      性别 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">请选择性别</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  角色名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：李小明"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  角色描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述角色的背景、性格、特征等..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{display: 'none'}}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    性别
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    年龄
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="例如：25"
                    min="0"
                    max="200"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  风格/类型
                </label>
                <input
                  type="text"
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  placeholder="例如：写实、卡通、赛博朋克"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  标签（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="例如：年轻, 活力, 科技"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">使用中文或英文逗号分隔多个标签</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all font-medium shadow-md shadow-purple-500/20 hover:shadow-purple-500/30"
                >
                  创建角色
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}