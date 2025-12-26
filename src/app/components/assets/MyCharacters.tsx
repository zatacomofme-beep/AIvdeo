import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Clock, Edit, X, Wand2, Loader2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';
import { showToast } from '../../lib/toast-utils';  // ✅ 导入 toast 工具
const API_BASE_URL = 'https://semopic.com';

export function MyCharacters() {
  const { myCharacters, addCharacter, deleteCharacter, user, isLoggedIn, loadUserData } = useStore();  // 添加 loadUserData
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

  // ✅ 组件初始化时从数据库加载数据
  useEffect(() => {
    if (user?.id) {
      console.log('[MyCharacters] 组件初始化，加载用户数据...');
      loadUserData(user.id);
    }
  }, [user?.id]);

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
      
      // AI生成成功，静默填充，不弹窗
      console.log('✅ AI生成成功，表单数据已更新');
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

    // 检查是否登录（实时获取最新状态）
    const currentUser = useStore.getState().user;
    const currentIsLoggedIn = useStore.getState().isLoggedIn;
    
    console.log('[MyCharacters] 当前用户:', currentUser);
    console.log('[MyCharacters] 登录状态:', currentIsLoggedIn);
    
    if (!currentIsLoggedIn || !currentUser) {
      alert('请先登录后再创建角色！');
      return;
    }

    // 开始创建，显示加载状态
    setIsGeneratingAI(true);
    
    try {
      // 使用当前登录用户的ID
      const currentUserId = currentUser.id;
      
      // 调用后端API创建角色（保存到数据库）
      const response = await fetch(`${API_BASE_URL}/api/create-character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUserId,  // 使用真实的用户ID
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
        characterId: result.character_id // 保存角色ID
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
      
      // ✅ 使用 toast 替代 alert
      showToast.success('角色创建成功', `角色ID: ${result.character_id}\n用户ID: ${currentUserId}`);
      
    } catch (error) {
      console.error('创建角色失败:', error);
      alert(`❌ 创建角色失败\n\n${error instanceof Error ? error.message : '请稍后重试'}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      <div className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900 flex items-center gap-3">
              <Users className="text-tech" size={32} />
              我的角色
              <span className="badge-tech ml-2">
                {myCharacters.length}
              </span>
            </h2>
            <p className="text-slate-600 mt-2 text-sm">管理您创建的所有虚拟角色</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-tech-ai flex items-center gap-2 px-4 py-2.5"
          >
            <Plus size={18} />
            创建角色
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar bg-slate-50">
        {myCharacters.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center mb-4 border border-slate-200">
              <Users size={40} className="text-slate-300" />
            </div>
            <p className="text-lg text-slate-600">暂无角色</p>
            <p className="text-sm mt-2">创建您的第一个虚拟角色</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {myCharacters.map((character) => (
              <div 
                key={character.id} 
                className="tech-card group relative overflow-hidden hover:shadow-tech-md transition-all"
              >
                {/* 紧凑的头部区域 */}
                <div className="relative bg-slate-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    {/* 首字母头像 */}
                    <div className="w-12 h-12 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {character.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* 删除按钮 */}
                    <button 
                      onClick={() => deleteCharacter(character.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/90 backdrop-blur-md text-red-500 hover:text-red-600 rounded-lg hover:bg-white transition-all shadow-sm"
                      title="删除角色"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  {/* 角色名称 */}
                  <h3 className="font-bold text-white text-base truncate mb-1" title={character.name}>
                    {character.name}
                  </h3>
                  
                  {/* Tags */}
                  {character.tags && character.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {character.tags.slice(0, 2).map((tag, index) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 信息区域 */}
                <div className="p-3 bg-white">
                  {/* 描述 */}
                  <p className="text-xs text-slate-600 line-clamp-2 mb-2 min-h-[2rem]">
                    {character.description}
                  </p>
                  
                  {/* 属性 */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    {character.gender && (
                      <span className="px-2 py-0.5 bg-slate-50 rounded">
                        {character.gender}
                      </span>
                    )}
                    {character.age && (
                      <span className="px-2 py-0.5 bg-slate-50 rounded">
                        {character.age}岁
                      </span>
                    )}
                  </div>

                  {/* 风格 */}
                  {character.style && (
                    <div className="text-xs text-tech mb-2 px-2 py-0.5 bg-tech-light/20 rounded inline-block">
                      {character.style}
                    </div>
                  )}

                  {/* 创建时间 */}
                  <div className="flex items-center gap-1 text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <Clock size={10} />
                    {formatDate(character.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Character Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="w-[700px] max-h-[90vh] bg-white flex flex-col rounded-lg overflow-hidden shadow-tech-lg">
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-8 border-b border-slate-200 shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-tech rounded-md flex items-center justify-center shadow-tech-sm text-white">
                  <Plus size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-slate-800">创建新角色</h2>
                  <p className="text-xs text-slate-500 mt-1">填写角色信息或使用AI生成</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAIGenerate}
                  disabled={isGeneratingAI}
                  className="btn-tech-ai flex items-center gap-1.5 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* 国家、人种、年龄、性别 - 先填写这4个参数 */}
              <div className="bg-tech-light/20 border-tech/30 p-4 rounded-md border">
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
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
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-tech focus:border-transparent transition-all"
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
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-tech focus:border-transparent transition-all"
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
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-tech focus:border-transparent transition-all"
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
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-tech focus:border-transparent transition-all"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-tech focus:border-transparent transition-all resize-none"
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-tech focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-tech focus:border-transparent transition-all"
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
                  className="flex-1 btn-tech-ai px-6 py-3 font-medium"
                >
                  创建角色
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}