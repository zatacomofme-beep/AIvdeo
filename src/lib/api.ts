import { Message, ScriptItem, ProductUnderstanding } from './store';

// 后端 API 基础 URL - 根据实际部署修改
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 定义与后端交互的数据类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatResponse {
  message: Message;
  projectUpdate?: {
    scale?: 'mini' | 'normal' | 'large';
    script?: ScriptItem[];
  };
}

/**
 * API 服务层 - 连接到 FastAPI 后端
 */
export const api = {
  
  /**
   * 上传图片到火山云 TOS
   */
  async uploadImage(file: File): Promise<string> {
    console.log('[API] Uploading image to backend...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '上传失败');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('上传失败:', error);
      throw error;
    }
  },

  /**
   * B 阶段：AI 产品理解
   */
  async understandProduct(payload: { imageUrl?: string; imageBase64?: string }): Promise<{
    success: boolean;
    projectUpdate?: { productUnderstanding?: ProductUnderstanding };
    error?: string;
  }> {
    console.log('[API] 产品理解阶段...');
    try {
      const response = await fetch(`${API_BASE_URL}/understand-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: payload.imageUrl || null,
          imageBase64: payload.imageBase64 || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '产品理解失败');
      }
      return await response.json();
    } catch (error) {
      console.error('产品理解失败:', error);
      throw error;
    }
  },

  /**
   * C 阶段：市场定位分析
   * 根据产品理解生成市场分析数据（market、segments、persona）
   */
  async analyzeMarket(payload: { productUnderstanding: any; overrides?: any }): Promise<{
    success: boolean;
    projectUpdate?: { marketAnalysis?: any };
    error?: string;
  }> {
    console.log('[API] 市场定位分析阶段...');
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-market`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUnderstanding: payload.productUnderstanding || {},
          overrides: payload.overrides || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '市场分析失败');
      }
      return await response.json();
    } catch (error) {
      console.error('市场分析失败:', error);
      throw error;
    }
  },

  /**
   * D 阶段：创意策略生成
   * 基于产品理解和市场分析生成创意策略（keyMessage、painReliefArc、tone、narrative）
   */
  async generateStrategy(payload: { productUnderstanding: any; marketAnalysis: any }): Promise<{
    success: boolean;
    projectUpdate?: { creativeStrategy?: any };
    error?: string;
  }> {
    console.log('[API] 创意策略生成阶段...');
    try {
      const response = await fetch(`${API_BASE_URL}/generate-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUnderstanding: payload.productUnderstanding || {},
          marketAnalysis: payload.marketAnalysis || {},
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '策略生成失败');
      }
      return await response.json();
    } catch (error) {
      console.error('策略生成失败:', error);
      throw error;
    }
  },

  /**
   * E 阶段：视觉风格匹配
   * 基于上下文生成风格候选列表供用户选择
   */
  async matchStyle(payload: { productUnderstanding: any; marketAnalysis: any; creativeStrategy: any }): Promise<{
    success: boolean;
    projectUpdate?: { styleCandidates?: any[] };
    error?: string;
  }> {
    console.log('[API] 视觉风格匹配阶段...');
    try {
      const response = await fetch(`${API_BASE_URL}/match-style`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUnderstanding: payload.productUnderstanding || {},
          marketAnalysis: payload.marketAnalysis || {},
          creativeStrategy: payload.creativeStrategy || {},
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '风格匹配失败');
      }
      return await response.json();
    } catch (error) {
      console.error('风格匹配失败:', error);
      throw error;
    }
  },

  /**
   * F 阶段：生成三套脚本
   * 根据上下文生成三套 10s 脚本供用户选择
   */
  async generateScripts(payload: { productUnderstanding: any; marketAnalysis: any; creativeStrategy: any; visualStyle: any }): Promise<{
    success: boolean;
    projectUpdate?: { scriptOptions?: any[] };
    error?: string;
  }> {
    console.log('[API] 三脚本生成阶段...');
    try {
      const response = await fetch(`${API_BASE_URL}/generate-scripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUnderstanding: payload.productUnderstanding || {},
          marketAnalysis: payload.marketAnalysis || {},
          creativeStrategy: payload.creativeStrategy || {},
          visualStyle: payload.visualStyle || {},
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '脚本生成失败');
      }
      return await response.json();
    } catch (error) {
      console.error('脚本生成失败:', error);
      throw error;
    }
  },

  /**
   * 一次性生成视频脚本（新架构）
   */
  async generateScript(productInfo: any, imageUrl?: string): Promise<{
    success: boolean;
    script: any[];
    targetAudience: any;
    visualPrompt: string;
  }> {
    console.log('[API] 生成视频脚本...');

    try {
      const response = await fetch(`${API_BASE_URL}/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          productInfo,
          imageUrl: imageUrl || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '生成脚本失败');
      }

      return await response.json();
    } catch (error) {
      console.error('生成脚本失败:', error);
      throw error;
    }
  },

  /**
   * 发送消息给 AI 导演
   */
  async sendChatMessage(content: string, context: any, imageUrl?: string, history?: any[]): Promise<ChatResponse> {
    console.log('[API] Sending message to backend:', content, imageUrl ? `with image: ${imageUrl}` : '');

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content, 
          context,
          image_url: imageUrl || null,
          history: history || []
        }),
      });

      if (!response.ok) {
        throw new Error('聊天请求失败');
      }

      return await response.json();
    } catch (error) {
      console.error('聊天失败:', error);
      throw error;
    }
  },

  /**
   * 锁定尺寸/物理属性
   */
  async lockPhysics(scale: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/lock-physics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scale }),
      });

      if (!response.ok) {
        throw new Error('锁定物理属性失败');
      }

      return await response.json();
    } catch (error) {
      console.error('锁定失败:', error);
      throw error;
    }
  },

  /**
   * 调用视频生成服务
   */
  async generateVideo(
    prompt: string, 
    images?: string[], 
    orientation?: string,
    size?: string,
    duration?: number
  ): Promise<{ url?: string; status: string; task_id?: string; message?: string }> {
    console.log('[API] Calling video generation API...');

    try {
      const response = await fetch(`${API_BASE_URL}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          images: images || [],
          orientation: orientation || 'portrait',
          size: size || 'large',
          duration: duration || 10,
          watermark: false,
          private: true
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '视频生成请求失败');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('生成视频失败:', error);
      throw error;
    }
  },

  /**
   * 查询视频生成任务状态
   */
  async queryVideoTask(taskId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/query-video-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: taskId }),
      });

      if (!response.ok) {
        throw new Error('查询任务失败');
      }

      return await response.json();
    } catch (error) {
      console.error('查询任务失败:', error);
      throw error;
    }
  },

  /**
   * 根据产品信息生成脚本（新业务流程）
   */
  async generateScriptFromProduct(payload: {
    productName: string;
    productImages: string[];
    usageMedia: any;
  }): Promise<{ success: boolean; shots: any[]; error?: string }> {
    console.log('[API] 根据产品信息生成脚本...');
    try {
      const response = await fetch(`${API_BASE_URL}/generate-script-from-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '脚本生成失败');
      }

      return await response.json();
    } catch (error) {
      console.error('脚本生成失败:', error);
      throw error;
    }
  }
};
