import { create } from 'zustand';

// ===========================
// 新的表单数据结构
// ===========================

// ===========================
// 阶段1：商品建模 (Product Modeling)
// ===========================
export interface ProductInfo {
  // 多图上传（5张高保真图片）
  productImages: string[];  // 5张商品图片URL（TOS）
  imagesBase64: string[];   // 5张图片的base64编码
  
  // 结构化表单
  productName: string;      // 产品的品牌与品类名
  brandName?: string;       // 品牌名称
  category?: string;        // 品类
  usageMethod: string;      // 使用方式（如"喷雾"、"佩戴"）
  sellingPoints: string[];  // 核心卖点（AI生成脚本的关键Prompt来源）
  
  // 持久化存档
  isSaved: boolean;         // 是否已保存为固定产品
  savedAt?: string;         // 保存时间
  productId?: string;       // 产品唯一ID（用于侧边栏加载）
}

// ===========================
// 阶段2：导演配置 (Director Settings)
// ===========================
export interface DirectorSettings {
  // 语言定位
  language: 'zh-CN' | 'en-US' | 'id-ID' | 'vi-VN';  // 中文、英文、印尼语、越南语
  
  // 分辨率控制
  resolution: '720p' | '1080p';  // 720P快速渲染，1080P高清成品
  
  // 时长定义
  duration: 15 | 25;  // 15s黄金转化时段，25s深度展示时段
  
  // 视频方向
  orientation: 'portrait' | 'landscape';  // 9:16竖屏或16:9横屏
}

// 3. 场景设置
export interface Scene {
  sceneType: 'office' | 'home' | 'outdoor' | 'studio' | 'custom';
  description: string;
  ambience: {
    lighting: 'natural' | 'bright' | 'dim';
    space: 'small' | 'medium' | 'spacious';
  };
}

// 4. 镜头运动
export interface Camera {
  shotType: 'low-angle' | 'eye-level' | 'high-angle' | 'bird-view';
  framing: 'close-up' | 'medium' | 'medium-close' | 'wide';
  movement: 'static' | 'dolly-zoom' | 'pan' | 'handheld';
  depthOfField: 'shallow' | 'normal' | 'deep';
  description: string;
}

// 5. 角色设定
export interface Character {
  age: 'GenZ' | 'Millennial' | '30s' | '40+';
  gender: 'Female' | 'Male' | 'Neutral';
  market: 'China' | 'Indonesia' | 'Vietnam' | 'Global';
  traits: string[];
  clothing: string;
  description: string;
}

// ===========================
// 阶段3：脚本创作 (Scripting Engine)
// ===========================
export interface ScriptShot {
  time: string;         // 时间轴（如"0-3s"）
  scene: string;        // 分镜场景描述
  action: string;       // 动作描述
  audio: string;        // 台词内容
  emotion: string;      // 情绪状态
  imageIndex?: number;  // 对应使用的图片索引（0-4）
}

export interface Script {
  shots: ScriptShot[];  // 分镜列表
  emotionArc: {
    start: 'anxious' | 'curious' | 'neutral';
    end: 'satisfied' | 'excited' | 'relieved';
  };
  mode: 'ai' | 'manual';     // AI生成或手动编辑
  isGenerated: boolean;       // 标记脚本是否已生成
  aiAssisted: boolean;        // 是否由AI导演辅助生成
  lastModified?: string;      // 最后修改时间
}

// 7. 音频氛围
export interface Audio {
  backgroundMusic: 'none' | 'subtle' | 'upbeat';
  ambientSound: string;
  voiceQuality: 'clear' | 'natural-with-noise';
  description: string;
}

// 8. 整体感觉
export interface OverallFeeling {
  vibe: string[];
  goal: string;
}

// ===========================
// Store 状态
// ===========================

// ===========================
// 阶段4：生成与交付 (Rendering & Delivery)
// ===========================
export interface RenderingStatus {
  status: 'idle' | 'rendering' | 'completed' | 'failed';
  progress: number;        // 进度百分比（0-100）
  taskId: string | null;   // 任务ID
  estimatedTime: number;   // 预计剩余时间（秒）
  videoUrl: string | null; // 生成的视频URL
}

// ===========================
// 用户认证状态
// ===========================
export interface User {
  id: string;
  email: string;
  username: string;
  credits?: number;
  role?: 'user' | 'admin';
  createdAt: number;
}

interface AuthState {
  currentUser: User | null;
  isLoggedIn: boolean;
  
  login: (user: User) => void;
  register: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  addCredits: (amount: number) => void;
}

// 用户认证 Store
export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoggedIn: false,
  
  login: (user) => {
    set({ currentUser: user, isLoggedIn: true });
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  },
  
  register: (user) => {
    const newUser = { ...user, credits: 520 }; // 初始积分
    set({ currentUser: newUser, isLoggedIn: true });
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    }
  },
  
  logout: () => {
    set({ currentUser: null, isLoggedIn: false });
    // 清除 localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
  },
  
  updateUser: (updates) => {
    set((state) => {
      if (!state.currentUser) return state;
      const updatedUser = { ...state.currentUser, ...updates };
      // 更新 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      return { currentUser: updatedUser };
    });
  },
  
  addCredits: (amount) => {
    set((state) => {
      if (!state.currentUser) return state;
      const updatedUser = {
        ...state.currentUser,
        credits: (state.currentUser.credits || 0) + amount
      };
      // 更新 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      return { currentUser: updatedUser };
    });
  }
}));

// 初始化时从 localStorage 加载用户信息
if (typeof window !== 'undefined') {
  try {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      useAuthStore.setState({ currentUser: user, isLoggedIn: true });
    }
  } catch (error) {
    console.error('加载用户信息失败:', error);
  }
}

// ===========================
// 主Store接口
// ===========================
interface FormStore {
  // 阶段1：商品建模
  productInfo: ProductInfo;
  savedProducts: ProductInfo[];  // 已保存的固定产品列表
  
  // 阶段2：导演配置
  directorSettings: DirectorSettings;
  
  // 阶段3：脚本创作
  script: Script;
  
  // 阶段4：生成与交付
  rendering: RenderingStatus;
  
  // 工作流程状态
  currentStage: 1 | 2 | 3 | 4;  // 当前处于哪个阶段
  
  // 方法：阶段1 - 商品建模
  updateProductInfo: (info: Partial<ProductInfo>) => void;
  saveProduct: () => Promise<void>;           // 保存为固定产品
  loadProduct: (productId: string) => void;   // 从侧边栏加载固定产品
  deleteProduct: (productId: string) => void; // 删除固定产品
  
  // 方法：阶段2 - 导演配置
  updateDirectorSettings: (settings: Partial<DirectorSettings>) => void;
  
  // 方法：阶段3 - 脚本创作
  updateScript: (script: Partial<Script>) => void;
  generateScriptWithAI: () => Promise<void>;  // AI导演辅助生成脚本
  modifyScript: (shotIndex: number, updates: Partial<ScriptShot>) => void;  // 即时修改脚本
  
  // 方法：阶段4 - 生成与交付
  startRendering: () => Promise<void>;        // 开始渲染
  pollRenderingStatus: () => Promise<void>;   // 轮询渲染状态
  cancelRendering: () => void;                // 取消渲染
  
  // 导航方法
  goToStage: (stage: 1 | 2 | 3 | 4) => void;  // 跳转到指定阶段
  nextStage: () => void;                      // 进入下一阶段
  prevStage: () => void;                      // 返回上一阶段
}

export interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  type?: 'text' | 'script_review';
  chips?: { label: string; value: string }[];
}

export interface ScriptItem {
  id: string;
  startTime: string;
  duration: string;
  content: string;
  action?: string;
}

export type PipelineStage =
  | 'image_uploaded'
  | 'scripts_generated'
  | 'script_selected'
  | 'ready_to_render';

interface ProjectState {
  credits: number;
  isGenerating: boolean;
  activeTab: 'studio' | 'assets' | 'prompt-square' | 'profile';
  
  // Canvas State
  uploadedImage: string | null;
  imageBase64: string | null;  // 存储base64编码，避免后端二次下载
  productName: string | null;  // 产品名称
  character: any | null;  // 角色信息
  pipelineStage: PipelineStage | null;
  scriptOptions: any[] | null;
  selectedScript: any[] | null;
  
  // Chat State
  messages: Message[];
  
  // Timeline State
  script: ScriptItem[];
  
  // Actions
  setPipelineStage: (stage: PipelineStage | null) => void;
  addMessage: (msg: Omit<Message, 'id'>) => void;
  setUploadedImage: (url: string) => void;
  setProductName: (name: string) => void;
  setScriptOptions: (opts: any[] | null) => void;
  setSelectedScript: (script: any[] | null) => void;
  setCharacter: (character: any) => void;
  setGenerating: (status: boolean) => void;
  deductCredits: (amount: number) => void;
  setActiveTab: (tab: 'studio' | 'assets' | 'prompt-square' | 'profile') => void;
}

export const useStore = create<ProjectState>((set) => ({
  credits: 520,
  isGenerating: false,
  activeTab: 'studio',
  
  uploadedImage: null,
  imageBase64: null,
  productName: null,
  character: null,
  pipelineStage: null,
  scriptOptions: null,
  selectedScript: null,
  
  messages: [
    {
      id: 'welcome',
      role: 'ai',
      content: '系统在线。SoraDirector v3.0 已初始化。请上传您的产品图片开始创作。',
      type: 'text'
    }
  ],
  
  script: [],

  setPipelineStage: (stage) => set({ pipelineStage: stage }),
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: Math.random().toString(36).substr(2, 9) }]
  })),

  setUploadedImage: (url) => set({ uploadedImage: url }),
  setProductName: (name) => set({ productName: name }),
  setScriptOptions: (opts) => set({ scriptOptions: opts }),
  setSelectedScript: (script) => set({ selectedScript: script }),
  setCharacter: (character) => set({ character }),
  setGenerating: (status) => set({ isGenerating: status }),
  deductCredits: (amount) => set((state) => ({ credits: state.credits - amount })),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

// ===========================
// 新的表单Store
// ===========================

export const useFormStore = create<FormStore>((set, get) => ({
  // 阶段1：商品建模 - 初始状态
  productInfo: {
    productImages: [],
    imagesBase64: [],
    productName: '',
    brandName: '',
    category: '',
    usageMethod: '',
    sellingPoints: [],
    isSaved: false,
  },
  savedProducts: [],  // 已保存的产品列表
  
  // 阶段2：导演配置 - 默认值
  directorSettings: {
    language: 'zh-CN',
    resolution: '1080p',
    duration: 15,
    orientation: 'portrait',
  },
  
  // 阶段3：脚本创作 - 空脚本
  script: {
    shots: [],
    emotionArc: {
      start: 'neutral',
      end: 'satisfied',
    },
    mode: 'ai',
    isGenerated: false,
    aiAssisted: false,
  },
  
  // 阶段4：生成与交付 - 空闲状态
  rendering: {
    status: 'idle',
    progress: 0,
    taskId: null,
    estimatedTime: 0,
    videoUrl: null,
  },
  
  // 当前处于阶段1
  currentStage: 1,
  
  // ========================================
  // 阶段1：商品建模 - 方法
  // ========================================
  updateProductInfo: (info) => {
    set((state) => ({
      productInfo: { ...state.productInfo, ...info },
    }));
  },
  
  saveProduct: async () => {
    const state = get();
    const { productInfo } = state;
    
    // 验证必填项
    if (productInfo.productImages.length !== 5) {
      alert('请上传5张商品图片');
      return;
    }
    if (!productInfo.productName || !productInfo.usageMethod) {
      alert('请填写商品名称和使用方式');
      return;
    }
    if (productInfo.sellingPoints.length === 0) {
      alert('请添加至少一个核心卖点');
      return;
    }
    
    // 生成唯一ID和时间戳
    const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const savedAt = new Date().toISOString();
    
    // 保存产品
    const savedProduct = {
      ...productInfo,
      isSaved: true,
      savedAt,
      productId,
    };
    
    set((state) => ({
      productInfo: savedProduct,
      savedProducts: [...state.savedProducts, savedProduct],
    }));
    
    // 持久化到localStorage
    try {
      const products = [...get().savedProducts];
      localStorage.setItem('savedProducts', JSON.stringify(products));
      alert('产品已保存！您可以从侧边栏随时加载');
    } catch (error) {
      console.error('保存产品失败:', error);
      alert('保存失败，请重试');
    }
  },
  
  loadProduct: (productId) => {
    const state = get();
    const product = state.savedProducts.find(p => p.productId === productId);
    if (product) {
      set({ productInfo: product });
      alert(`已加载产品：${product.productName}`);
    }
  },
  
  deleteProduct: (productId) => {
    set((state) => ({
      savedProducts: state.savedProducts.filter(p => p.productId !== productId),
    }));
    
    // 更新localStorage
    try {
      const products = get().savedProducts;
      localStorage.setItem('savedProducts', JSON.stringify(products));
    } catch (error) {
      console.error('删除产品失败:', error);
    }
  },
  
  // ========================================
  // 阶段2：导演配置 - 方法
  // ========================================
  updateDirectorSettings: (settings) => {
    set((state) => ({
      directorSettings: { ...state.directorSettings, ...settings },
    }));
  },
  
  // ========================================
  // 阶段3：脚本创作 - 方法
  // ========================================
  updateScript: (script) => {
    set((state) => ({
      script: { 
        ...state.script, 
        ...script,
        lastModified: new Date().toISOString(),
      },
    }));
  },
  
  generateScriptWithAI: async () => {
    const state = get();
    const { productInfo, directorSettings } = state;
    
    // 验证前置条件
    if (productInfo.productImages.length !== 5) {
      alert('请先完成商品建模（阶段1）');
      return;
    }
    
    // 设置渲染状态为生成中
    set((state) => ({
      rendering: { ...state.rendering, status: 'rendering', progress: 10 },
    }));
    
    try {
      const { api } = await import('./api');
      
      // 调用后端AI生成脚本
      const response = await api.generateScriptFromProduct({
        productName: productInfo.productName,
        productImages: productInfo.productImages,
        usageMethod: productInfo.usageMethod,
        sellingPoints: productInfo.sellingPoints,
        language: directorSettings.language,
        duration: directorSettings.duration,
      });
      
      // 更新脚本
      set((state) => ({
        script: {
          ...state.script,
          shots: response.shots || [],
          isGenerated: true,
          aiAssisted: true,
          mode: 'ai',
          lastModified: new Date().toISOString(),
        },
        rendering: { ...state.rendering, status: 'idle', progress: 0 },
      }));
      
      alert('AI脚本生成成功！您可以在此基础上继续修改');
    } catch (error) {
      console.error('AI脚本生成失败:', error);
      set((state) => ({
        rendering: { ...state.rendering, status: 'failed', progress: 0 },
      }));
      alert('AI脚本生成失败，请重试');
    }
  },
  
  modifyScript: (shotIndex, updates) => {
    set((state) => {
      const newShots = [...state.script.shots];
      if (shotIndex >= 0 && shotIndex < newShots.length) {
        newShots[shotIndex] = { ...newShots[shotIndex], ...updates };
      }
      return {
        script: {
          ...state.script,
          shots: newShots,
          lastModified: new Date().toISOString(),
        },
      };
    });
  },
  
  // ========================================
  // 阶段4：生成与交付 - 方法
  // ========================================
  startRendering: async () => {
    const state = get();
    const { productInfo, directorSettings, script } = state;
    
    // 验证前置条件
    if (!script.isGenerated || script.shots.length === 0) {
      alert('请先生成脚本（阶段3）');
      return;
    }
    
    // 设置渲染状态
    set((state) => ({
      rendering: {
        ...state.rendering,
        status: 'rendering',
        progress: 0,
        estimatedTime: directorSettings.duration * 10,  // 估计时间
      },
    }));
    
    try {
      const { api } = await import('./api');
      
      // 组装Prompt
      const prompt = script.shots.map(s => 
        `${s.time}: ${s.scene}. ${s.action}. "${s.audio}"`
      ).join('\n');
      
      // 调用视频生成API
      const response = await api.generateVideo(
        prompt,
        productInfo.productImages,
        directorSettings.orientation,
        directorSettings.resolution === '1080p' ? 'large' : 'small',
        directorSettings.duration
      );
      
      // 保存任务ID并开始轮询
      if (response.task_id) {
        set((state) => ({
          rendering: { ...state.rendering, taskId: response.task_id },
        }));
        get().pollRenderingStatus();
      } else if (response.url) {
        // 同步返回，直接完成
        set((state) => ({
          rendering: {
            ...state.rendering,
            status: 'completed',
            progress: 100,
            videoUrl: response.url,
            estimatedTime: 0,
          },
        }));
      }
    } catch (error) {
      console.error('视频渲染失败:', error);
      set((state) => ({
        rendering: { ...state.rendering, status: 'failed', progress: 0 },
      }));
      alert('视频生成失败，请重试');
    }
  },
  
  pollRenderingStatus: async () => {
    const state = get();
    const { rendering } = state;
    
    if (!rendering.taskId || rendering.status !== 'rendering') {
      return;
    }
    
    try {
      const { api } = await import('./api');
      const response = await api.queryVideoTask(rendering.taskId);
      
      if (response.status === 'completed') {
        set((state) => ({
          rendering: {
            ...state.rendering,
            status: 'completed',
            progress: 100,
            videoUrl: response.video_url || response.url,
            estimatedTime: 0,
          },
        }));
      } else if (response.status === 'failed') {
        set((state) => ({
          rendering: { ...state.rendering, status: 'failed', progress: 0 },
        }));
      } else {
        // 更新进度
        const progress = Math.min(90, rendering.progress + 5);
        set((state) => ({
          rendering: { ...state.rendering, progress },
        }));
        
        // 继续轮询
        setTimeout(() => get().pollRenderingStatus(), 3000);
      }
    } catch (error) {
      console.error('查询渲染状态失败:', error);
      // 继续重试
      setTimeout(() => get().pollRenderingStatus(), 5000);
    }
  },
  
  cancelRendering: () => {
    set((state) => ({
      rendering: {
        ...state.rendering,
        status: 'idle',
        progress: 0,
        taskId: null,
        estimatedTime: 0,
      },
    }));
  },
  
  // ========================================
  // 导航方法
  // ========================================
  goToStage: (stage) => {
    set({ currentStage: stage });
  },
  
  nextStage: () => {
    set((state) => ({
      currentStage: Math.min(4, state.currentStage + 1) as 1 | 2 | 3 | 4,
    }));
  },
  
  prevStage: () => {
    set((state) => ({
      currentStage: Math.max(1, state.currentStage - 1) as 1 | 2 | 3 | 4,
    }));
  },
}));

// 初始化时从 localStorage 加载已保存的产品
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('savedProducts');
    if (saved) {
      const products = JSON.parse(saved);
      useFormStore.setState({ savedProducts: products });
    }
  } catch (error) {
    console.error('加载保存的产品失败:', error);
  }
}
