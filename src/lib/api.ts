import { Message, ScriptItem } from './store';

// 后端API基础URL - 直接连接远程服务器
const API_BASE_URL = 'http://115.190.137.87:8000';

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
    console.log('[API] File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    console.log('[API] Target URL:', `${API_BASE_URL}/api/upload-image`);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // 打印FormData内容（调试用）
    console.log('[API] FormData entries:');
    for (let pair of formData.entries()) {
      console.log('  ', pair[0], ':', pair[1]);
    }

    try {
      console.log('[API] Sending POST request...');
      const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: 'POST',
        body: formData,
      });
      
      console.log('[API] Response status:', response.status);
      console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Error response:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { detail: errorText };
        }
        throw new Error(error.detail || '上传失败');
      }

      const data = await response.json();
      console.log('[API] Upload success, URL:', data.url);
      return data.url;
    } catch (error) {
      console.error('[API] Upload failed:', error);
      console.error('[API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[API] Error message:', error instanceof Error ? error.message : String(error));
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
  },

  /**
   * 使用AI生成角色信息（不保存到数据库）
   */
  async generateCharacter(params: {
    country?: string;
    ethnicity?: string;
    age?: number;
    gender?: string;
  }): Promise<{
    id: string;
    name: string;
    description: string;
    age?: number;
    gender?: string;
    ethnicity?: string;
    country?: string;
  }> {
    console.log('[API] 调用AI生成角色...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'AI生成角色失败');
      }

      return await response.json();
    } catch (error) {
      console.error('AI生成角色失败:', error);
      throw error;
    }
  },

  /**
   * 创建角色（保存到数据库）
   */
  async createCharacter(params: {
    user_id: string;
    name: string;
    description: string;
    age?: number;
    gender?: string;
    style?: string;
    tags?: string[];
  }): Promise<{
    success: boolean;
    character_id: string;
    data: any;
  }> {
    console.log('[API] 保存角色到数据库...');
    try {
      const response = await fetch(`${API_BASE_URL}/create-character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '创建角色失败');
      }

      return await response.json();
    } catch (error) {
      console.error('创建角色失败:', error);
      throw error;
    }
  },

  /**
   * 用户注册
   */
  async register(params: {
    email: string;
    password: string;
    username: string;
  }): Promise<{
    success: boolean;
    user: {
      id: string;
      email: string;
      username: string;
      credits: number;
      role: 'user' | 'admin';  // 修复类型
      createdAt: number;
    };
    message: string;
  }> {
    console.log('[API] 用户注册...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '注册失败');
      }

      return await response.json();
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  },

  /**
   * 用户登录
   */
  async login(params: {
    email: string;
    password: string;
  }): Promise<{
    success: boolean;
    user: {
      id: string;
      email: string;
      username: string;
      credits: number;
      role: 'user' | 'admin';  // 修复类型
      createdAt: number;
    };
    message: string;
  }> {
    console.log('[API] 用户登录...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '登录失败');
      }

      return await response.json();
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  /**
   * 消费积分
   */
  async consumeCredits(params: {
    user_id: string;
    amount: number;
    action: string;
    description?: string;
  }): Promise<{
    success: boolean;
    credits: number;
    consumed: number;
    message: string;
  }> {
    console.log('[API] 消费积分...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/credits/consume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '消费积分失败');
      }

      return await response.json();
    } catch (error) {
      console.error('消费积分失败:', error);
      throw error;
    }
  },

  /**
   * 充值积分
   */
  async rechargeCredits(params: {
    user_id: string;
    amount: number;  // 支付金额（元）
    credits: number;  // 获得积分
    payment_method: string;  // 支付方式
    order_id?: string;  // 订单ID
  }): Promise<{
    success: boolean;
    credits: number;
    recharged: number;
    amount: number;
    message: string;
  }> {
    console.log('[API] 充值积分...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/credits/recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '充值失败');
      }

      return await response.json();
    } catch (error) {
      console.error('充值失败:', error);
      throw error;
    }
  },

  /**
   * 获取积分余额
   */
  async getCreditsBalance(user_id: string): Promise<{
    success: boolean;
    user_id: string;
    credits: number;
    username: string;
    email: string;
  }> {
    console.log('[API] 获取积分余额...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/credits/balance/${user_id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '获取余额失败');
      }

      return await response.json();
    } catch (error) {
      console.error('获取余额失败:', error);
      throw error;
    }
  },

  /**
   * 获取积分历史
   */
  async getCreditsHistory(user_id: string): Promise<{
    history: Array<{
      id: string;
      action: string;
      amount: number;
      balanceAfter: number;
      description: string;
      createdAt: number;
    }>;
  }> {
    console.log('[API] 获取积分历史...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/credits/history/${user_id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '获取历史失败');
      }

      return await response.json();
    } catch (error) {
      console.error('获取历史失败:', error);
      throw error;
    }
  }
};
