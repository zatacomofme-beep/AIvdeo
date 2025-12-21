/**
 * Mock API for demonstration
 * Replace this with your real backend API calls
 */

export const mockApi = {
  /**
   * Upload image to storage
   */
  async uploadImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Analyze product image with GPT-4o Vision
   */
  async analyzeProduct(imageBase64: string) {
    await this.delay(1500);
    
    return {
      productType: 'spray',
      scaleConstraint: 'miniature',
      description: '紫色喷雾瓶，适合手持使用',
      suggestedName: '清新口气喷雾'
    };
  },

  /**
   * Send chat message to AI Director
   */
  async sendChatMessage(message: string, context: any) {
    await this.delay(1000);
    
    // Mock AI responses based on context
    if (!context.product_name) {
      return {
        message: {
          role: 'ai' as const,
          content: `我理解了！${message} 是个很棒的产品。\n\n接下来，告诉我：\n1. 目标市场是哪个国家？\n2. 希望视频的主角是什么风格？`,
          type: 'chips' as const,
          chips: [
            { label: '🇨🇳 中国', value: 'china' },
            { label: '🇮🇩 印尼', value: 'indonesia' },
            { label: '🇺🇸 美国', value: 'usa' }
          ]
        }
      };
    }

    return {
      message: {
        role: 'ai' as const,
        content: `好的！我会为 ${context.product_name} 创作一个真实感的 UGC 风格视频。\n\n准备好了吗？点击"生成视频"开始创作！`,
        type: 'text' as const
      },
      projectUpdate: {
        character: {
          age: 'GenZ',
          market: 'China',
          description: '年轻都市女性，自然妆容'
        }
      }
    };
  },

  /**
   * Generate video script
   */
  async generateScript(productInfo: any) {
    await this.delay(2000);
    
    return {
      shots: [
        {
          time: '0-3s',
          scene: '办公室内，午餐后',
          action: '主角偷偷拿出喷雾',
          audio: '吃完大蒜，有点尴尬...',
          emotion: 'anxious'
        },
        {
          time: '3-6s',
          scene: '特写产品使用',
          action: '食指轻轻按压喷头',
          audio: '赶紧来一下',
          emotion: 'focused'
        },
        {
          time: '6-10s',
          scene: '会议室门口',
          action: '自信微笑',
          audio: '安心开会去～',
          emotion: 'relieved'
        }
      ],
      emotionArc: {
        start: 'anxious',
        end: 'relieved'
      }
    };
  },

  /**
   * Generate video with Sora
   */
  async generateVideo(
    prompt: string,
    images: string[],
    orientation: string,
    size: string,
    duration: number
  ) {
    await this.delay(3000);
    
    // Mock: Return a processing task
    return {
      status: 'processing',
      task_id: `task_${Date.now()}`,
      message: '视频生成中，预计需要 2-3 分钟',
      estimatedTime: 120
    };
  },

  /**
   * Query video generation task status
   */
  async queryVideoTask(taskId: string) {
    await this.delay(1000);
    
    // Mock: Randomly return completed or processing
    const isComplete = Math.random() > 0.5;
    
    if (isComplete) {
      return {
        status: 'completed',
        video_url: 'https://example.com/generated-video.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=600&fit=crop'
      };
    }

    return {
      status: 'processing',
      progress: Math.floor(Math.random() * 80) + 10
    };
  },

  /**
   * Helper: Simulate network delay
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
