/**
 * Example of how to integrate with your real backend API
 * Copy this file to api.ts and implement your actual API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = {
  /**
   * Upload image to TOS storage
   * @param file - Image file to upload
   * @returns URL of uploaded image
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.url; // TOS URL
  },

  /**
   * Analyze product image with GPT-4o Vision
   * @param imageUrl - URL of uploaded image
   * @returns Product analysis result
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
      throw new Error('Analysis failed');
    }

    return await response.json();
    // Expected response:
    // {
    //   productType: 'spray',
    //   scaleConstraint: 'miniature',
    //   description: '...',
    //   suggestedName: '...'
    // }
  },

  /**
   * Send chat message to AI Director
   * @param message - User message
   * @param context - Conversation context
   * @param history - Previous messages
   * @returns AI response
   */
  async sendChatMessage(
    message: string,
    context: { product_name?: string },
    imageUrl?: string,
    history?: Array<{ role: string; content: string }>
  ) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        image_url: imageUrl,
        history: history || [],
      }),
    });

    if (!response.ok) {
      throw new Error('Chat request failed');
    }

    return await response.json();
    // Expected response:
    // {
    //   message: {
    //     role: 'ai',
    //     content: '...',
    //     type: 'text' | 'chips',
    //     chips?: [...]
    //   },
    //   projectUpdate?: {
    //     character?: {...},
    //     script?: {...}
    //   }
    // }
  },

  /**
   * Generate video script from product info
   * @param productInfo - Product information
   * @returns Generated script
   */
  async generateScript(productInfo: {
    productName: string;
    productImages: string[];
    usageMethod: string;
    sellingPoints: string[];
    language: string;
    duration: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productInfo),
    });

    if (!response.ok) {
      throw new Error('Script generation failed');
    }

    return await response.json();
    // Expected response:
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
   * Generate video with Sora
   * @param prompt - Final video prompt
   * @param images - Product images
   * @param orientation - Video orientation
   * @param size - Video size
   * @param duration - Video duration
   * @returns Generation result
   */
  async generateVideo(
    prompt: string,
    images: string[],
    orientation: string,
    size: string,
    duration: number
  ) {
    const response = await fetch(`${API_BASE_URL}/api/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        images,
        orientation,
        size,
        duration,
      }),
    });

    if (!response.ok) {
      throw new Error('Video generation failed');
    }

    return await response.json();
    // Expected response:
    // {
    //   status: 'processing' | 'completed',
    //   task_id?: '...',
    //   url?: '...',
    //   message?: '...'
    // }
  },

  /**
   * Query video generation task status
   * @param taskId - Task ID
   * @returns Task status
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
      throw new Error('Task query failed');
    }

    return await response.json();
    // Expected response:
    // {
    //   status: 'processing' | 'completed' | 'failed',
    //   progress?: 0-100,
    //   video_url?: '...',
    //   thumbnail?: '...'
    // }
  },

  /**
   * Get user credits
   * @returns User credits info
   */
  async getUserCredits() {
    const response = await fetch(`${API_BASE_URL}/api/user/credits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers if needed
        // 'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get credits');
    }

    return await response.json();
    // Expected response:
    // {
    //   credits: 520
    // }
  },

  /**
   * Deduct user credits
   * @param amount - Amount to deduct
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
      throw new Error('Failed to deduct credits');
    }

    return await response.json();
  },
};

// Example usage in DirectorPanel.tsx:
/*
import { api } from '../lib/api';

// In handleSend function:
const response = await api.sendChatMessage(
  userMessage,
  { product_name: productName },
  uploadedImage,
  messages.map(m => ({ role: m.role, content: m.content }))
);

addMessage(response.message);

if (response.projectUpdate?.character) {
  setCharacter(response.projectUpdate.character);
}

// In handleGenerateVideo function:
const result = await api.generateVideo(
  finalPrompt,
  [uploadedImage],
  'portrait',
  'large',
  10
);

if (result.task_id) {
  // Start polling for status
  pollVideoStatus(result.task_id);
}
*/
