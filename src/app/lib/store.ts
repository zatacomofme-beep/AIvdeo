import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username: string;
  credits: number;  // 新增：用户积分
  createdAt: number;
  role?: 'user' | 'admin';  // 新增：用户角色
}

export interface Product {
  id: string;
  name: string;
  category: string;
  usage: string;
  sellingPoints: string;
  imageUrls: string[]; // 改为数组，支持多张图片
  createdAt: number;
}

export interface VideoConfig {
  country: string;
  language: string;
  style?: string; // 新增：视频风格
  orientation: 'horizontal' | 'vertical';
  resolution: '720p' | '1080p';
  duration: '15s' | '25s';
}

export interface GeneratedVideo {
  id: string;
  url: string;
  thumbnail: string;
  script: string;
  productName: string;
  createdAt: number;
  status: 'processing' | 'completed' | 'failed';  // 新增：视频状态
  taskId?: string;  // 新增：任务ID，用于轮询
  progress?: number;  // 新增：生成进度 0-100
  error?: string;  // 新增：错误信息
}

export interface SavedPrompt {
  id: string;
  content: string;
  productName: string;
  createdAt: number;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  avatar: string;
  age?: number;
  gender?: string;
  style?: string;
  tags?: string[];
  characterId?: string; // Sora2角色ID
  createdAt: number;
}

interface AppStore {
  // User state - 新增用户状态
  user: User | null;
  isLoggedIn: boolean;
  credits: number;
  
  // Upload state - 改为数组支持多张图片
  uploadedImages: string[];
  imagesBase64: string[];
  
  // AI Director state
  showDirector: boolean;
  showCreateProduct: boolean;  // 新增：显示创建商品面板
  currentStep: number;
  isGenerating: boolean;
  
  // Product management
  savedProducts: Product[];
  currentProduct: Product | null;
  
  // Video configuration
  videoConfig: VideoConfig | null;
  script: string;
  isGeneratingScript: boolean;
  
  // Selected character
  selectedCharacter: Character | null;
  
  // Video generation
  videoCount: number;
  videoUrl: string | null;
  
  // My Assets - 新增我的资产
  myVideos: GeneratedVideo[];
  myPrompts: SavedPrompt[];
  myCharacters: Character[];
  
  // User Actions - 新增用户操作
  login: (user: User) => void;
  logout: () => void;
  register: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  addCredits: (amount: number) => void;
  
  // Actions
  setUploadedImages: (urls: string[]) => void;
  addUploadedImage: (url: string) => void;
  removeUploadedImage: (index: number) => void;
  setImagesBase64: (base64Array: string[]) => void;
  setShowDirector: (show: boolean) => void;
  setShowCreateProduct: (show: boolean) => void;  // 新增：设置创建商品面板
  setCurrentStep: (step: number) => void;
  setGenerating: (generating: boolean) => void;
  
  // Product actions
  saveProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  loadProduct: (productId: string) => void;
  setCurrentProduct: (product: Product | null) => void;
  deleteProduct: (productId: string) => void;
  
  // Video config actions
  setVideoConfig: (config: VideoConfig) => void;
  setScript: (script: string) => void;
  setGeneratingScript: (generating: boolean) => void;
  setSelectedCharacter: (character: Character | null) => void;
  
  // Video generation actions
  setVideoCount: (count: number) => void;
  setVideoUrl: (url: string | null) => void;
  deductCredits: (amount: number) => void;
  setCredits: (credits: number) => void;
  
  // My Assets actions
  addGeneratedVideo: (video: Omit<GeneratedVideo, 'id' | 'createdAt'>) => void;
  updateVideoStatus: (videoId: string, updates: Partial<GeneratedVideo>) => void;  // 新增：更新视频状态
  deleteVideo: (videoId: string) => void;
  savePrompt: (prompt: Omit<SavedPrompt, 'id' | 'createdAt'>) => void;
  deletePrompt: (promptId: string) => void;
  addCharacter: (character: Omit<Character, 'id' | 'createdAt'>) => void;
  deleteCharacter: (characterId: string) => void;
  
  resetProject: () => void;
}

export const useStore = create<AppStore>()(persist((set) => ({
  // Initial state
  user: null,
  isLoggedIn: false,
  credits: 0,  // 修改：初始积分为 0，登录/注册后同步后端积分
  uploadedImages: [],
  imagesBase64: [],
  showDirector: false,
  showCreateProduct: false,  // 新增：初始化为false
  currentStep: 1,
  isGenerating: false,
  savedProducts: [],
  currentProduct: null,
  videoConfig: null,
  script: '',
  isGeneratingScript: false,
  selectedCharacter: null,
  videoCount: 1,
  videoUrl: null,
  myVideos: [],
  myPrompts: [],
  myCharacters: [],
  
  // User Actions
  login: (user) => set({ 
    user: { ...user, credits: user.credits || 0 },  // 确保 user.credits 和 store.credits 同步
    isLoggedIn: true,
    credits: user.credits || 0  // 同步后端返回的积分
  }),
  logout: () => set({ user: null, isLoggedIn: false, credits: 0 }),
  register: (user) => set({ 
    user: { ...user, credits: user.credits || 520 },  // 确保 user.credits 和 store.credits 同步
    isLoggedIn: true,
    credits: user.credits || 520  // 同步后端返回的积分
  }),
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),
  addCredits: (amount) => set((state) => ({ 
    credits: state.credits + amount 
  })),
  
  // Actions
  setUploadedImages: (urls) => set({ uploadedImages: urls }),
  addUploadedImage: (url) => set((state) => {
    if (state.uploadedImages.length >= 5) {
      alert('最多只能上传5张图片');
      return state;
    }
    return { uploadedImages: [...state.uploadedImages, url] };
  }),
  removeUploadedImage: (index) => set((state) => ({
    uploadedImages: state.uploadedImages.filter((_, i) => i !== index),
    imagesBase64: state.imagesBase64.filter((_, i) => i !== index)
  })),
  setImagesBase64: (base64Array) => set({ imagesBase64: base64Array }),
  setShowDirector: (show) => set({ showDirector: show, currentStep: show ? 1 : 1 }),
  setShowCreateProduct: (show) => set({ 
    showCreateProduct: show,
    // 打开创建商品面板时清空上传的图片
    uploadedImages: show ? [] : [],
  }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setGenerating: (generating) => set({ isGenerating: generating }),
  
  // Product actions
  saveProduct: (productData) => set((state) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: Date.now()
    };
    return {
      savedProducts: [...state.savedProducts, newProduct],
      currentProduct: newProduct
    };
  }),
  
  loadProduct: (productId) => set((state) => {
    const product = state.savedProducts.find(p => p.id === productId);
    return { currentProduct: product || null };
  }),
  
  setCurrentProduct: (product) => set({ currentProduct: product }),
  
  deleteProduct: (productId) => set((state) => ({
    savedProducts: state.savedProducts.filter(p => p.id !== productId),
    currentProduct: state.currentProduct?.id === productId ? null : state.currentProduct
  })),
  
  // Video config actions
  setVideoConfig: (config) => set({ videoConfig: config }),
  setScript: (script) => set({ script }),
  setGeneratingScript: (generating) => set({ isGeneratingScript: generating }),
  setSelectedCharacter: (character) => set({ selectedCharacter: character }),
  
  // Video generation actions
  setVideoCount: (count) => set({ videoCount: count }),
  setVideoUrl: (url) => set({ videoUrl: url }),
  
  deductCredits: (amount) => set((state) => ({ 
    credits: Math.max(0, state.credits - amount) 
  })),
  
  setCredits: (credits) => set((state) => ({
    credits,
    user: state.user ? { ...state.user, credits } : null  // 同步更新user.credits
  })),
  
  // My Assets actions
  addGeneratedVideo: (videoData) => set((state) => ({
    myVideos: [{
      ...videoData,
      id: Date.now().toString(),
      createdAt: Date.now()
    }, ...state.myVideos]
  })),
  
  updateVideoStatus: (videoId, updates) => set((state) => ({
    myVideos: state.myVideos.map(video => 
      video.id === videoId ? { ...video, ...updates } : video
    )
  })),
  
  deleteVideo: (videoId) => set((state) => ({
    myVideos: state.myVideos.filter(v => v.id !== videoId)
  })),
  
  savePrompt: (promptData) => set((state) => ({
    myPrompts: [{
      ...promptData,
      id: Date.now().toString(),
      createdAt: Date.now()
    }, ...state.myPrompts]
  })),
  
  deletePrompt: (promptId) => set((state) => ({
    myPrompts: state.myPrompts.filter(p => p.id !== promptId)
  })),
  
  addCharacter: (characterData) => set((state) => ({
    myCharacters: [{
      ...characterData,
      id: Date.now().toString(),
      createdAt: Date.now()
    }, ...state.myCharacters]
  })),
  
  deleteCharacter: (characterId) => set((state) => ({
    myCharacters: state.myCharacters.filter(c => c.id !== characterId)
  })),
  
  resetProject: () => set({
    uploadedImages: [],
    imagesBase64: [],
    showDirector: false,
    currentStep: 1,
    isGenerating: false,
    currentProduct: null,
    videoConfig: null,
    script: '',
    isGeneratingScript: false,
    videoCount: 1,
    videoUrl: null
  })
}), {
  name: 'app-store',
  partialize: (state) => ({
    // 只持久化这些字段，排除大型数据
    user: state.user,
    isLoggedIn: state.isLoggedIn,
    credits: state.credits,
    savedProducts: state.savedProducts,
    myVideos: state.myVideos,
    myPrompts: state.myPrompts,
    myCharacters: state.myCharacters,
    // 不持久化 uploadedImages, imagesBase64, videoUrl 等大型数据
  })
}));