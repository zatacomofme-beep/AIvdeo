import { create } from 'zustand';

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

interface ProjectState {
  credits: number;
  isGenerating: boolean;
  activeTab: 'studio' | 'assets' | 'prompt-square' | 'profile';
  
  // Canvas State
  uploadedImage: string | null;
  productScale: 'mini' | 'normal' | 'large' | null;
  
  // Chat State
  messages: Message[];
  
  // Timeline State
  script: ScriptItem[];
  
  // Actions
  addMessage: (msg: Omit<Message, 'id'>) => void;
  setUploadedImage: (url: string) => void;
  setProductScale: (scale: 'mini' | 'normal' | 'large') => void;
  setGenerating: (status: boolean) => void;
  deductCredits: (amount: number) => void;
  setActiveTab: (tab: 'studio' | 'assets' | 'prompt-square' | 'profile') => void;
}

export const useStore = create<ProjectState>((set) => ({
  credits: 520,
  isGenerating: false,
  activeTab: 'studio',
  
  uploadedImage: null,
  productScale: null,
  
  messages: [
    {
      id: 'welcome',
      role: 'ai',
      content: '系统在线。SoraDirector v3.0 已初始化。请将您的产品图片上传到画布以开始视觉锚定。',
      type: 'text'
    }
  ],
  
  script: [],

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: Math.random().toString(36).substr(2, 9) }]
  })),

  setUploadedImage: (url) => set({ uploadedImage: url }),
  setProductScale: (scale) => set({ productScale: scale }),
  setGenerating: (status) => set({ isGenerating: status }),
  deductCredits: (amount) => set((state) => ({ credits: state.credits - amount })),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
