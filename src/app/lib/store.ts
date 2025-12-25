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
  saveProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;  // 修改：返回Promise
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
  addGeneratedVideo: (videoData: Omit<GeneratedVideo, 'id' | 'createdAt'>) => Promise<string>;
  updateVideoStatus: (videoId: string, updates: Partial<GeneratedVideo>) => void;  // 新增：更新视频状态
  deleteVideo: (videoId: string) => void;
  savePrompt: (prompt: Omit<SavedPrompt, 'id' | 'createdAt'>) => void;
  updatePrompt: (promptId: string, content: string) => void;  // 新增：更新提示词
  deletePrompt: (promptId: string) => void;
  addCharacter: (character: Omit<Character, 'id' | 'createdAt'>) => void;
  deleteCharacter: (characterId: string) => void;
  
  // 数据加载
  loadUserData: (userId: string) => Promise<void>;
  
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
  saveProduct: async (productData) => {
    const state = useStore.getState();
    
    // 检查是否登录
    if (!state.user) {
      alert('请先登录后再保存商品');
      return;
    }
    
    try {
      // 调用后端API保存商品
      const { api } = await import('../../lib/api');
      const response = await api.createProduct({
        user_id: state.user.id,
        name: productData.name,
        category: productData.category,
        description: productData.usage,  // 使用 usage 作为 description
        selling_points: productData.sellingPoints ? [productData.sellingPoints] : [],
        images: productData.imageUrls
      });
      
      // 保存成功后，添加到本地state
      const newProduct: Product = {
        id: response.product.id,  // 使用后端返回的ID
        name: productData.name,
        category: productData.category,
        usage: productData.usage,
        sellingPoints: productData.sellingPoints,
        imageUrls: productData.imageUrls,
        createdAt: response.product.createdAt || Date.now()
      };
      
      set((state) => ({
        savedProducts: [...state.savedProducts, newProduct],
        currentProduct: newProduct
      }));
      
      console.log('[商品保存] 成功保存到数据库:', response.product.id);
    } catch (error) {
      console.error('[商品保存] 失败:', error);
      alert('保存商品失败，请重试');
    }
  },
  
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
  addGeneratedVideo: async (videoData) => {
    const state = useStore.getState();
    if (!state.user?.id) {
      // 用户未登录，只保存到本地
      set((state) => ({
        myVideos: [{
          ...videoData,
          id: Date.now().toString(),
          createdAt: Date.now()
        }, ...state.myVideos]
      }));
      return Date.now().toString();
    }

    try {
      const { api } = await import('../../lib/api');
      
      // 调用后端API保存视频
      const response = await api.saveVideo({
        user_id: state.user.id,
        video_url: videoData.url,
        thumbnail_url: videoData.thumbnail,
        script: videoData.script,
        product_name: videoData.productName,
        status: videoData.status,
        task_id: videoData.taskId,
        progress: videoData.progress || 0,
        is_public: false
      });

      if (response.success) {
        // 成功保存，添加到本地状态
        set((state) => ({
          myVideos: [{
            id: response.video.id,
            url: response.video.url,
            thumbnail: response.video.thumbnail || '',
            script: response.video.script,
            productName: response.video.productName || '',
            status: response.video.status,
            isPublic: response.video.isPublic,
            taskId: response.video.taskId,
            progress: response.video.progress || 0,
            createdAt: response.video.createdAt
          }, ...state.myVideos]
        }));
        console.log('✅ 视频已保存到数据库');
        return response.video.id;
      }
    } catch (error) {
      console.error('保存视频失败:', error);
      // 失败时仍然保存到本地
      const localId = Date.now().toString();
      set((state) => ({
        myVideos: [{
          ...videoData,
          id: localId,
          createdAt: Date.now()
        }, ...state.myVideos]
      }));
      return localId;
    }
  },
  
  updateVideoStatus: (videoId, updates) => set((state) => ({
    myVideos: state.myVideos.map(video => 
      video.id === videoId ? { ...video, ...updates } : video
    )
  })),
  
  deleteVideo: (videoId) => set((state) => ({
    myVideos: state.myVideos.filter(v => v.id !== videoId)
  })),
  
  savePrompt: async (promptData) => {
    const state = useStore.getState();
    if (!state.user?.id) return;

    try {
      const { api } = await import('../../lib/api');
      const response = await api.savePrompt({
        user_id: state.user.id,
        content: promptData.content,
        product_name: promptData.productName || ''
      });

      if (response.success) {
        set((state) => ({
          myPrompts: [response.prompt, ...state.myPrompts]
        }));
      }
    } catch (error) {
      console.error('保存提示词失败:', error);
      // 失败时仍然保存到本地
      set((state) => ({
        myPrompts: [{
          ...promptData,
          id: Date.now().toString(),
          createdAt: Date.now()
        }, ...state.myPrompts]
      }));
    }
  },
    
  updatePrompt: (promptId, content) => set((state) => ({
    myPrompts: state.myPrompts.map(p => 
      p.id === promptId ? { ...p, content } : p
    )
  })),
  
  deletePrompt: async (promptId) => {
    try {
      const { api } = await import('../../lib/api');
      await api.deletePrompt(promptId);
      set((state) => ({
        myPrompts: state.myPrompts.filter(p => p.id !== promptId)
      }));
    } catch (error) {
      console.error('删除提示词失败:', error);
    }
  },
  
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

  // 从数据库加载用户数据
  loadUserData: async (userId: string) => {
    console.log('[Store] ========== 开始加载用户数据 ==========');
    console.log('[Store] 用户ID:', userId);
    try {
      const { api } = await import('../../lib/api');
      
      console.log('[Store] 正在并行加载角色、商品、提示词和视频...');
      // 并行加载所有数据
      const [charactersResponse, productsResponse, promptsResponse, videosResponse] = await Promise.all([
        api.getUserCharacters(userId),
        api.getUserProducts(userId),
        api.getUserPrompts(userId),
        api.getUserVideos(userId)
      ]);

      console.log('[Store] ✅ 角色数据:', charactersResponse);
      console.log('[Store] ✅ 商品数据:', productsResponse);
      console.log('[Store] ✅ 提示词数据:', promptsResponse);
      console.log('[Store] ✅ 视频数据:', videosResponse);

      // 转换并设置角色数据
      const characters = charactersResponse.characters.map(c => {
        console.log('[Store] 转换角色:', c);
        return {
          id: c.id,
          name: c.name,
          description: c.description,
          avatar: '',
          age: c.age,
          gender: c.gender,
          style: c.style,
          tags: c.tags || [],
          createdAt: c.createdAt
        };
      });

      // 转换并设置商品数据
      const products = productsResponse.products.map(p => {
        console.log('[Store] 转换商品:', p);
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          usage: p.usage || '',
          sellingPoints: p.sellingPoints || '',
          imageUrls: p.imageUrls || [],
          createdAt: p.createdAt
        };
      });

      // 转换并设置提示词数据
      const prompts = promptsResponse.prompts.map(p => {
        console.log('[Store] 转换提示词:', p);
        return {
          id: p.id,
          content: p.content,
          productName: p.productName || '',
          createdAt: p.createdAt
        };
      });

      // 转换并设置视频数据
      const videos = videosResponse.videos.map(v => {
        console.log('[Store] 转换视频:', v);
        
        // 修复状态逻辑：根据实际情况修正状态
        let correctStatus = v.status;
        if (v.url && v.url !== '') {
          // 如果有URL，状态应该是completed
          correctStatus = 'completed';
        } else if (v.error) {
          // 如果有错误信息，状态应该是failed
          correctStatus = 'failed';
        }
        
        console.log(`[Store] 视频${v.id}：数据库状态=${v.status}, 修正后=${correctStatus}, url=${v.url ? '有' : '无'}`);
        
        return {
          id: v.id,
          url: v.url,
          thumbnail: v.thumbnail || '',
          script: v.script,
          productName: v.productName || '',
          status: correctStatus,  // 使用修正后的状态
          isPublic: v.isPublic,
          taskId: v.taskId,
          progress: correctStatus === 'completed' ? 100 : (v.progress || 0),  // 已完成的视频进度为100
          error: v.error,
          createdAt: v.createdAt
        };
      });

      console.log('[Store] 设置数据到 store...');
      console.log('[Store] - 角色数量:', characters.length);
      console.log('[Store] - 商品数量:', products.length);
      console.log('[Store] - 提示词数量:', prompts.length);
      console.log('[Store] - 视频数量:', videos.length);

      set({
        myCharacters: characters,
        savedProducts: products,
        myPrompts: prompts,
        myVideos: videos
      });

      console.log('[Store] ========== 用户数据加载完成 ==========');
    } catch (error) {
      console.error('[Store] ❌ 加载用户数据失败:', error);
      if (error instanceof Error) {
        console.error('[Store] 错误详情:', error.message);
        console.error('[Store] 错误堆栈:', error.stack);
      }
    }
  },
  
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
    user: state.user,        // user对象包含credits，不需要单独持久化
    isLoggedIn: state.isLoggedIn,
    // ❗ 删除 credits 的单独持久化，避免与 user.credits 冲突
    savedProducts: state.savedProducts,
    myVideos: state.myVideos,
    myPrompts: state.myPrompts,
    myCharacters: state.myCharacters,
    // 不持久化 uploadedImages, imagesBase64, videoUrl 等大型数据
  }),
  onRehydrateStorage: () => (state) => {
    // persist恢复后，从 user.credits 同步到 store.credits
    if (state && state.user && state.user.credits !== undefined) {
      state.credits = state.user.credits;
      console.log('[Store] Persist恢复，同步积分:', state.credits);
    }
  }
}));