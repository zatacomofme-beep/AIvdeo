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

  /**
   * 发送消息给 AI 导演
   */
  async sendChatMessage(content: string, context: any): Promise<ChatResponse> {
    console.log('[API] Sending message to backend:', content);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, context }),
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
  }
};
