import { Message, ScriptItem } from './store';

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

  // 已移除产品理解接口 - 不再需要视觉识别功能

  // 已移除复杂的多阶段分析接口 - 简化为直接的脚本生成流程

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

  // 已移除尺寸锁定接口 - 不再需要尺寸约束功能

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
   * 根据商品信息生成脚本（新业务流程）
   */
  async generateScriptFromProduct(payload: {
    productName: string;
    productImages: string[];
    usageMethod: string;
    sellingPoints: string[];
    language: string;
    duration: number;
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
