import { create } from 'zustand';

// ===========================
// 新的表单数据结构
// ===========================

// 1. 产品信息（新业务流程）
export interface ProductInfo {
  productImages: string[];  // 5张商品图片URL
  imagesBase64: string[];   // 5张图片的base64编码
  productName: string;
  usageMedia: {           // 使用方法视频或图文说明
    type: 'video' | 'images' | null;
    videoUrl?: string;
    imageUrls?: string[];
    textDescription?: string;
  };
}

// 2. 视频风格
export interface VideoStyle {
  styleType: 'realistic' | 'casual' | 'professional' | 'cinematic';
  duration: 10 | 15 | 20;
  orientation: 'portrait' | 'landscape';
  quality: 'standard' | 'high';
  customDescription: string;
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

// 6. 脚本（AI生成）
export interface ScriptShot {
  time: string;
  scene: string;
  action: string;
  audio: string;
  emotion: string;
  imageIndex?: number;  // 对应使用的图片索引（0-4）
}

export interface Script {
  shots: ScriptShot[];
  emotionArc: {
    start: 'anxious' | 'curious' | 'neutral';
    end: 'satisfied' | 'excited' | 'relieved';
  };
  mode: 'ai' | 'manual';
  isGenerated: boolean;  // 标记脚本是否已生成
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

interface FormStore {
  // 表单数据
  productInfo: ProductInfo;
  videoStyle: VideoStyle;
  scene: Scene;
  camera: Camera;
  character: Character;
  script: Script;
  audio: Audio;
  overallFeeling: OverallFeeling;
  
  // 业务流程状态
  currentStep: 'upload' | 'script_generating' | 'script_ready' | 'video_generating' | 'completed';
  
  // 实时Prompt
  assembledPrompt: string;
  
  // 视频生成状态
  isGenerating: boolean;
  generatedVideoUrl: string | null;
  
  // 更新方法
  updateProductInfo: (info: Partial<ProductInfo>) => void;
  updateVideoStyle: (style: Partial<VideoStyle>) => void;
  updateScene: (scene: Partial<Scene>) => void;
  updateCamera: (camera: Partial<Camera>) => void;
  updateCharacter: (character: Partial<Character>) => void;
  updateScript: (script: Partial<Script>) => void;
  updateAudio: (audio: Partial<Audio>) => void;
  updateOverallFeeling: (feeling: Partial<OverallFeeling>) => void;
  
  // 业务流程方法
  submitProductInfo: () => Promise<void>;  // 提交产品信息并生成脚本
  generateVideoFromScript: () => Promise<void>;  // 根据脚本生成视频
  
  // 组装Prompt
  assemblePrompt: () => void;
  
  // 生成视频（保留旧方法兼容）
  generateVideo: () => Promise<void>;
  
  // AI识别产品（已废弃，但保留兼容）
  recognizeProduct: (imageBase64: string) => Promise<void>;
}

export interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  type?: 'text' | 'scale_selector' | 'script_review';
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
  | 'product_understanding'
  | 'market_analysis'
  | 'creative_strategy'
  | 'style_matching'
  | 'scripts_generated'
  | 'script_selected'
  | 'ready_to_render';

export interface SizeOption {
  label: string;
  value: 'mini' | 'normal' | 'large';
  description?: string;
}

export interface ProductUnderstanding {
  productName: string;
  productType?: string;
  attributes?: { material?: string; color?: string; shape?: string };
  sizeOptions?: SizeOption[];
}

interface ProjectState {
  credits: number;
  isGenerating: boolean;
  activeTab: 'studio' | 'assets' | 'prompt-square' | 'profile';
  
  // Canvas State
  uploadedImage: string | null;
  imageBase64: string | null;  // 存储base64编码，避免后端二次下载
  productScale: 'mini' | 'normal' | 'large' | null;
  productName: string | null;  // 产品名称
  character: any | null;  // 角色信息
  pipelineStage: PipelineStage | null;
  productUnderstanding: ProductUnderstanding | null;
  marketAnalysis: any | null;
  creativeStrategy: any | null;
  visualStyle: any | null;
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
  setProductScale: (scale: 'mini' | 'normal' | 'large') => void;
  setProductName: (name: string) => void;
  setProductUnderstanding: (pu: ProductUnderstanding | null) => void;
  setMarketAnalysis: (ma: any | null) => void;
  setCreativeStrategy: (cs: any | null) => void;
  setVisualStyle: (vs: any | null) => void;
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
  productScale: null,
  productName: null,
  character: null,
  pipelineStage: null,
  productUnderstanding: null,
  marketAnalysis: null,
  creativeStrategy: null,
  visualStyle: null,
  scriptOptions: null,
  selectedScript: null,
  
  messages: [
    {
      id: 'welcome',
      role: 'ai',
      content: '系统在线。SoraDirector v3.0 已初始化。请将您的产品图片上传到画布以开始视觉锚定。',
      type: 'text'
    }
  ],
  
  script: [],

  setPipelineStage: (stage) => set({ pipelineStage: stage }),
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: Math.random().toString(36).substr(2, 9) }]
  })),

  setUploadedImage: (url) => set({ uploadedImage: url }),
  setProductScale: (scale) => set({ productScale: scale }),
  setProductName: (name) => set({ productName: name }),
  setProductUnderstanding: (pu) => set({ productUnderstanding: pu }),
  setMarketAnalysis: (ma) => set({ marketAnalysis: ma }),
  setCreativeStrategy: (cs) => set({ creativeStrategy: cs }),
  setVisualStyle: (vs) => set({ visualStyle: vs }),
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
  // 初始化表单数据（空状态）
  productInfo: {
    productImages: [],
    imagesBase64: [],
    productName: '',
    usageMedia: {
      type: null,
      videoUrl: undefined,
      imageUrls: [],
      textDescription: '',
    },
  },
  
  videoStyle: {
    styleType: 'realistic',
    duration: 10,
    orientation: 'portrait',
    quality: 'high',
    customDescription: '',
  },
  
  scene: {
    sceneType: 'office',
    description: '',
    ambience: {
      lighting: 'natural',
      space: 'medium',
    },
  },
  
  camera: {
    shotType: 'eye-level',
    framing: 'medium',
    movement: 'handheld',
    depthOfField: 'normal',
    description: '',
  },
  
  character: {
    age: 'GenZ',
    gender: 'Neutral',
    market: 'China',
    traits: [],
    clothing: '',
    description: '',
  },
  
  script: {
    shots: [
      { time: '', scene: '', action: '', audio: '', emotion: '', imageIndex: 0 },
    ],
    emotionArc: {
      start: 'neutral',
      end: 'satisfied',
    },
    mode: 'ai',
    isGenerated: false,
  },
  
  audio: {
    backgroundMusic: 'none',
    ambientSound: '',
    voiceQuality: 'clear',
    description: '',
  },
  
  overallFeeling: {
    vibe: [],
    goal: '',
  },
  
  currentStep: 'upload',
  assembledPrompt: '',
  isGenerating: false,
  generatedVideoUrl: null,
  
  // 更新方法
  updateProductInfo: (info) => {
    set((state) => ({
      productInfo: { ...state.productInfo, ...info },
    }));
    get().assemblePrompt();
  },
  
  updateVideoStyle: (style) => {
    set((state) => ({
      videoStyle: { ...state.videoStyle, ...style },
    }));
    get().assemblePrompt();
  },
  
  updateScene: (scene) => {
    set((state) => ({
      scene: { ...state.scene, ...scene },
    }));
    get().assemblePrompt();
  },
  
  updateCamera: (camera) => {
    set((state) => ({
      camera: { ...state.camera, ...camera },
    }));
    get().assemblePrompt();
  },
  
  updateCharacter: (character) => {
    set((state) => ({
      character: { ...state.character, ...character },
    }));
    get().assemblePrompt();
  },
  
  updateScript: (script) => {
    set((state) => ({
      script: { ...state.script, ...script },
    }));
    get().assemblePrompt();
  },
  
  updateAudio: (audio) => {
    set((state) => ({
      audio: { ...state.audio, ...audio },
    }));
    get().assemblePrompt();
  },
  
  updateOverallFeeling: (feeling) => {
    set((state) => ({
      overallFeeling: { ...state.overallFeeling, ...feeling },
    }));
    get().assemblePrompt();
  },
  
  // 组装Prompt
  assemblePrompt: () => {
    const state = get();
    const { productInfo, videoStyle, scene, camera, character, script, audio, overallFeeling } = state;
    
    const prompt = `Video style: ${videoStyle.customDescription}, ${videoStyle.duration}s, ${videoStyle.orientation}

Scene: ${scene.description}

Camera: ${camera.description}

Tone & pacing: ${script.emotionArc.start} to ${script.emotionArc.end}, conversational, natural pauses, relaxed and friendly

Character: ${character.description}

Spoken script:
${script.shots.map(s => `${s.time}: ${s.audio}${s.imageIndex !== undefined ? ` [Image ${s.imageIndex + 1}]` : ''}`).join('\n')}

Audio: ${audio.description}

Overall feeling: ${overallFeeling.vibe.join(', ')}, ${overallFeeling.goal}

Product: ${productInfo.productName}

Usage instructions: ${productInfo.usageMedia.textDescription || 'See video/images'}`;
    
    set({ assembledPrompt: prompt });
  },
  
  // 提交产品信息并生成脚本
  submitProductInfo: async () => {
    const state = get();
    const { productInfo } = state;
    
    // 验证必填项
    if (productInfo.productImages.length !== 5) {
      alert('请上传5张商品图片');
      return;
    }
    if (!productInfo.productName) {
      alert('请填写商品名称');
      return;
    }
    if (!productInfo.usageMedia.type) {
      alert('请上传使用方法视频或图文说明');
      return;
    }
    
    set({ currentStep: 'script_generating', isGenerating: true });
    
    try {
      const { api } = await import('./api');
      
      // 调用后端生成脚本
      const response = await api.generateScriptFromProduct({
        productName: productInfo.productName,
        productImages: productInfo.productImages,
        usageMedia: productInfo.usageMedia,
      });
      
      // 更新脚本数据
      set((state) => ({
        script: {
          ...state.script,
          shots: response.shots || [],
          isGenerated: true,
        },
        currentStep: 'script_ready',
        isGenerating: false,
      }));
      
      // 自动组装Prompt
      get().assemblePrompt();
    } catch (error) {
      console.error('脚本生成失败:', error);
      set({ currentStep: 'upload', isGenerating: false });
      alert('脚本生成失败，请重试');
    }
  },
  
  // 根据脚本生成视频
  generateVideoFromScript: async () => {
    const state = get();
    
    if (!state.script.isGenerated) {
      alert('请先生成脚本');
      return;
    }
    
    set({ currentStep: 'video_generating', isGenerating: true });
    
    try {
      const { api } = await import('./api');
      
      // 调用后端生成视频
      const response = await api.generateVideo(
        state.assembledPrompt,
        state.productInfo.productImages,  // 传递5张图片
        state.videoStyle.orientation,
        state.videoStyle.quality === 'high' ? 'large' : 'medium',
        state.videoStyle.duration
      );
      
      set({
        generatedVideoUrl: response.url || null,
        currentStep: 'completed',
        isGenerating: false,
      });
    } catch (error) {
      console.error('视频生成失败:', error);
      set({ currentStep: 'script_ready', isGenerating: false });
      alert('视频生成失败，请重试');
    }
  },
  
  // 生成视频
  generateVideo: async () => {
    const state = get();
    set({ isGenerating: true });
    
    try {
      const { api } = await import('./api');
      
      // 调用后端API
      const response = await api.generateVideo(
        state.assembledPrompt,
        state.productInfo.productImage ? [state.productInfo.productImage] : [],
        state.videoStyle.orientation,
        state.videoStyle.quality === 'high' ? 'large' : 'medium',
        state.videoStyle.duration
      );
      
      set({
        generatedVideoUrl: response.url || null,
        isGenerating: false,
      });
    } catch (error) {
      console.error('视频生成失败:', error);
      set({ isGenerating: false });
    }
  },
  
  // AI识别产品
  recognizeProduct: async (imageBase64: string) => {
    try {
      const { api } = await import('./api');
      const response = await api.understandProduct({ imageBase64 });
      const pu = response.projectUpdate?.productUnderstanding;
      
      if (pu) {
        set((state) => ({
          productInfo: {
            ...state.productInfo,
            productName: pu.productName || '',
            productType: pu.productType || '',
            attributes: pu.attributes || state.productInfo.attributes,
            negativePrompts: pu.negativePrompts || state.productInfo.negativePrompts,
            imageBase64,
          },
        }));
        get().assemblePrompt();
      }
    } catch (error) {
      console.error('AI识别失败:', error);
    }
  },
}));
