import { toast as sonnerToast } from 'sonner';

/**
 * 统一的 Toast 提示工具
 * 所有提示都从右上角滑出，避免使用浏览器原生 alert
 */

export const toast = {
  /**
   * 成功提示（绿色）
   */
  success: (message: string) => {
    sonnerToast.success(message, {
      position: 'top-right',
      duration: 3000,
    });
  },

  /**
   * 错误提示（红色）
   */
  error: (message: string) => {
    sonnerToast.error(message, {
      position: 'top-right',
      duration: 4000,
    });
  },

  /**
   * 警告提示（黄色）
   */
  warning: (message: string) => {
    sonnerToast.warning(message, {
      position: 'top-right',
      duration: 3500,
    });
  },

  /**
   * 信息提示（蓝色）
   */
  info: (message: string) => {
    sonnerToast.info(message, {
      position: 'top-right',
      duration: 3000,
    });
  },

  /**
   * 加载提示
   */
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      position: 'top-right',
    });
  },

  /**
   * 关闭加载提示
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};
