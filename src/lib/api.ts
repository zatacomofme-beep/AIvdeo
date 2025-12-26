import { Message, ScriptItem } from './store';

// 后端API基础URL - 使用HTTPS域名(不包含/api路径)
// 修复：统一使用www前缀，避免CORS跨域问题
export const API_BASE_URL = 'https://www.semopic.com';

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

  /**
   * 从 TOS 删除图片
   */
  async deleteImage(imageUrl: string): Promise<boolean> {
    console.log('[API] Deleting image from TOS:', imageUrl);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/delete-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: imageUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[API] Delete failed:', error);
        return false;
      }

      console.log('[API] Image deleted successfully');
      return true;
    } catch (error) {
      console.error('[API] Delete image failed:', error);
      return false;
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
      const response = await fetch(`${API_BASE_URL}/api/generate-script`, {
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
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
    
    const payload = {
      prompt,
      images: images || [],
      orientation: orientation || 'portrait',
      size: size || 'large',
      duration: duration || 10,
      watermark: false,
      private: true
    };
    
    console.log('[API] 请求参数:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[API] 请求失败:', response.status, error);
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
      const response = await fetch(`${API_BASE_URL}/api/video-task/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${API_BASE_URL}/api/generate-script-from-product`, {
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
   * 使用AI生成角色（不保存到数据库）
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
      const response = await fetch(`${API_BASE_URL}/api/create-character`, {
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
  } | null> {
    console.log('[API] 获取积分余额...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/credits/balance/${user_id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        // 404错误不抛出异常，返回null（容错处理）
        if (response.status === 404) {
          console.warn('[API] 积分接口404，可能服务端版本未更新');
          return null;
        }
        const error = await response.json();
        throw new Error(error.detail || '获取余额失败');
      }

      return await response.json();
    } catch (error) {
      // 网络错误或404，返回null不阻塞业务
      if (error instanceof TypeError) {
        console.error('[API] 网络错误:', error);
        return null;
      }
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
  },

  /**
   * 获取用户统计数据
   */
  async getUserStats(user_id: string): Promise<{
    success: boolean;
    videoCount: number;
    productCount: number;
    totalConsumed: number;
  } | null> {
    console.log('[API] 获取用户统计数据...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${user_id}/stats`, {
        method: 'GET',
      });

      if (!response.ok) {
        // 404错误不抛出异常，返回null（容错处理）
        if (response.status === 404) {
          console.warn('[API] 统计接口404，可能服务端版本未更新');
          return null;
        }
        const error = await response.json();
        throw new Error(error.detail || '获取统计数据失败');
      }

      return await response.json();
    } catch (error) {
      // 网络错误或404，返回null不阻塞业务
      if (error instanceof TypeError) {
        console.error('[API] 网络错误:', error);
        return null;
      }
      console.error('获取统计数据失败:', error);
      throw error;
    }
  },

  /**
   * 创建商品
   */
  async createProduct(params: {
    user_id: string;
    name: string;
    category: string;
    description?: string;  // 修改：将 usage 改为 description
    selling_points?: string[];
    images?: string[];
  }): Promise<{
    success: boolean;
    product: {
      id: string;
      name: string;
      category: string;
      images: string[];
      sellingPoints: string[];
      createdAt: number;
    };
  }> {
    console.log('[API] 创建商品...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '创建商品失败');
      }

      return await response.json();
    } catch (error) {
      console.error('创建商品失败:', error);
      throw error;
    }
  },

  // 获取用户的所有商品
  async getUserProducts(user_id: string): Promise<{
    products: Array<{
      id: string;
      name: string;
      category: string;
      usage?: string;
      sellingPoints?: string;
      imageUrls?: any;
      createdAt: number;
    }>;
  }> {
    console.log('[API] 获取用户商品列表...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${user_id}`);
      if (!response.ok) {
        throw new Error('获取商品列表失败');
      }
      return await response.json();
    } catch (error) {
      console.error('获取商品列表失败:', error);
      throw error;
    }
  },

  // 获取用户的所有角色
  async getUserCharacters(user_id: string): Promise<{
    characters: Array<{
      id: string;
      name: string;
      description: string;
      age?: number;
      gender?: string;
      style?: string;
      tags?: string[];
      createdAt: number;
    }>;
  }> {
    console.log('[API] 获取用户角色列表...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/characters/${user_id}`);
      if (!response.ok) {
        throw new Error('获取角色列表失败');
      }
      return await response.json();
    } catch (error) {
      console.error('获取角色列表失败:', error);
      throw error;
    }
  },

  // 获取用户的所有提示词
  async getUserPrompts(user_id: string): Promise<{
    prompts: Array<{
      id: string;
      content: string;
      productName?: string;
      createdAt: number;
    }>;
  }> {
    console.log('[API] 获取用户提示词列表...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompts/${user_id}`);
      if (!response.ok) {
        throw new Error('获取提示词列表失败');
      }
      return await response.json();
    } catch (error) {
      console.error('获取提示词列表失败:', error);
      throw error;
    }
  },

  // 获取用户的所有视频
  async getUserVideos(user_id: string): Promise<{
    videos: Array<{
      id: string;
      url: string;
      thumbnail?: string;
      script?: any;
      productName?: string;
      status: 'processing' | 'completed' | 'failed';
      isPublic: boolean;
      taskId?: string;
      progress?: number;
      error?: string;
      createdAt: number;
    }>;
  }> {
    console.log('[API] 获取用户视频列表...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/videos/${user_id}`);
      if (!response.ok) {
        throw new Error('获取视频列表失败');
      }
      return await response.json();
    } catch (error) {
      console.error('获取视频列表失败:', error);
      throw error;
    }
  },

  /**
   * 生成九宫格图片
   */
  async generateNineGrid(imageUrl: string, userId: string): Promise<{ 
    gridUrl: string; 
    imageId: string;
    credits: number; 
    consumed: number; 
    message: string;
  }> {
    console.log('[API] Generating nine-grid image:', imageUrl, 'User:', userId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-nine-grid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl,
          user_id: userId 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[API] Generate nine-grid failed:', error);
        throw new Error(error.detail || '九宫格图片生成失败');
      }

      const data = await response.json();
      console.log('[API] Nine-grid generated:', data);
      return {
        gridUrl: data.gridUrl,
        imageId: data.imageId,
        credits: data.credits,
        consumed: data.consumed,
        message: data.message
      };
    } catch (error) {
      console.error('[API] Generate nine-grid failed:', error);
      throw error;
    }
  },

  /**
   * 获取用户生成的九宫格图片列表
   */
  async getGeneratedImages(userId: string): Promise<{
    success: boolean;
    images: Array<{
      id: string;
      gridUrl: string;
      originalUrl: string;
      modelName: string;
      creditsCost: number;
      createdAt: number;
      tags?: string[];
      category?: string;
    }>;
  }> {
    console.log('[API] 获取九宫格图片列表...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/generated-images/${userId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '获取图片列表失败');
      }
      return await response.json();
    } catch (error) {
      console.error('获取图片列表失败:', error);
      throw error;
    }
  },

  /**
   * 删除九宫格图片记录
   */
  async deleteGeneratedImage(imageId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    console.log('[API] 删除九宫格图片...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/generated-images/${imageId}?user_id=${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '删除图片失败');
      }
      return await response.json();
    } catch (error) {
      console.error('删除图片失败:', error);
      throw error;
    }
  },

  /**
   * 删除视频
   */
  async deleteVideo(videoId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    console.log('[API] 删除视频...', videoId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/videos/${videoId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '删除视频失败');
      }
      return await response.json();
    } catch (error) {
      console.error('删除视频失败:', error);
      throw error;
    }
  },

  /**
   * 切换视频公开状态
   */
  async toggleVideoPublic(videoId: string, isPublic: boolean): Promise<{
    success: boolean;
    message: string;
  }> {
    console.log(`[API] 切换视频${videoId}公开状态:`, isPublic);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/video/${videoId}/public?isPublic=${isPublic}`, {
        method: 'PUT',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '切换公开状态失败');
      }
      return await response.json();
    } catch (error) {
      console.error('切换公开状态失败:', error);
      throw error;
    }
  }
};
