/**
 * 后端API接口集成
 * 连接到 FastAPI 后端服务
 */

const API_BASE_URL = 'http://115.190.137.87:8000';

export const api = {
  /**
   * 上传图片到TOS存储
   * @param file - 图片文件
   * @returns 上传后的图片URL
   */
  async uploadImage(file: File): Promise<string> {
    console.log('[API] Uploading image...', file.name, file.size, 'bytes');
    
    const formData = new FormData();
    formData.append('file', file);  // 修复：字段名改为 'file'

    // 直连服务器，不通过 Vite 代理
    const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Upload failed:', response.status, errorText);
      throw new Error('图片上传失败');
    }

    const data = await response.json();
    console.log('[API] Upload success:', data.url);
    return data.url; // 返回TOS URL
  },

  /**
   * 使用GPT-4o Vision分析产品图片
   * @param imageUrl - 图片URL
   * @returns 产品分析结果
   */
  async analyzeProduct(imageUrl: string) {
    const response = await fetch(`${API_BASE_URL}/api/analyze-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });

    if (!response.ok) {
      throw new Error('产品分析失败');
    }

    return await response.json();
    // 返回格式:
    // {
    //   productType: 'spray',
    //   scaleConstraint: 'miniature',
    //   description: '...',
    //   suggestedName: '...'
    // }
  },

  /**
   * 生成视频脚本
   * @param productInfo - 产品信息
   * @returns 生成的脚本
   */
  async generateScript(productInfo: {
    productName: string;
    category: string;
    usageMethod: string;
    sellingPoints: string[];
    targetCountry: string;
    language: string;
    duration: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName: productInfo.productName,
        category: productInfo.category,
        usageMethod: productInfo.usageMethod,
        sellingPoints: productInfo.sellingPoints,
        language: productInfo.language,
        duration: productInfo.duration,
      }),
    });

    if (!response.ok) {
      throw new Error('脚本生成失败');
    }

    return await response.json();
    // 返回格式:
    // {
    //   shots: [
    //     {
    //       time: '0-3s',
    //       scene: '...',
    //       action: '...',
    //       audio: '...',
    //       emotion: '...'
    //     },
    //     ...
    //   ],
    //   emotionArc: { start: '...', end: '...' }
    // }
  },

  /**
   * 使用Sora生成视频
   * @param params - 视频生成参数
   * @returns 生成任务信息
   */
  async generateVideo(params: {
    script: string;
    productImages: string[];
    orientation: string;
    resolution: string;
    duration: number;
    language: string;
    characterId?: string; // 新增：角色ID，如果传入则使用带角色的视频生成
  }) {
    const response = await fetch(`${API_BASE_URL}/api/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params.script,
        images: params.productImages,
        orientation: params.orientation,
        size: params.resolution,
        duration: params.duration,
        watermark: false,  // 添加：是否有水印，默认false
        private: true,     // 添加：是否隐藏视频，默认true
        character_id: params.characterId, // 传递角色ID
      }),
    });

    if (!response.ok) {
      throw new Error('视频生成请求失败');
    }

    return await response.json();
    // 返回格式:
    // {
    //   status: 'processing' | 'completed',
    //   task_id?: '...',
    //   url?: '...',
    //   message?: '...'
    // }
  },

  /**
   * 查询视频生成任务状态
   * @param taskId - 任务ID
   * @returns 任务状态
   */
  async queryVideoTask(taskId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/video-task/${taskId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('任务查询失败');
    }

    return await response.json();
    // 返回格式:
    // {
    //   status: 'processing' | 'completed' | 'failed',
    //   progress?: 0-100,
    //   video_url?: '...',
    //   thumbnail?: '...'
    // }
  },

  /**
   * 获取用户积分
   * @returns 用户积分信息
   */
  async getUserCredits() {
    const response = await fetch(`${API_BASE_URL}/api/user/credits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 如果需要认证，添加：
        // 'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('获取积分失败');
    }

    return await response.json();
    // 返回格式:
    // {
    //   credits: 520
    // }
  },

  /**
   * 扣除用户积分
   * @param amount - 扣除数量
   */
  async deductCredits(amount: number) {
    const response = await fetch(`${API_BASE_URL}/api/user/deduct-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      throw new Error('积分扣除失败');
    }

    return await response.json();
  },

  /**
   * 创建 Sora 角色
   * @param character - 角色信息
   * @returns 创建结果
   */
  async createCharacter(character: {
    name: string;
    description: string;
    avatar: string;
    age?: number;
    gender?: string;
    style?: string;
    tags?: string[];
  }) {
    const response = await fetch(`${API_BASE_URL}/api/create-character`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(character),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '创建角色失败');
    }

    return await response.json();
    // 返回格式:
    // {
    //   success: true,
    //   character_id: '...',
    //   data: { ... }
    // }
  },
};
