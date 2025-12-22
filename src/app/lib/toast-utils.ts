// 全局 Toast 工具 - 用于替代 alert()
// 使用方法: import { showToast } from '@/app/lib/toast-utils';
// 然后: showToast.success('标题', '消息');

type ToastHandler = {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

let toastHandler: ToastHandler | null = null;

export const registerToastHandler = (handler: ToastHandler) => {
  toastHandler = handler;
};

export const showToast = {
  success: (title: string, message?: string) => {
    if (toastHandler) {
      toastHandler.success(title, message);
    } else {
      // 降级为 alert
      alert(`✅ ${title}\n\n${message || ''}`);
    }
  },
  error: (title: string, message?: string) => {
    if (toastHandler) {
      toastHandler.error(title, message);
    } else {
      alert(`❌ ${title}\n\n${message || ''}`);
    }
  },
  warning: (title: string, message?: string) => {
    if (toastHandler) {
      toastHandler.warning(title, message);
    } else {
      alert(`⚠️ ${title}\n\n${message || ''}`);
    }
  },
  info: (title: string, message?: string) => {
    if (toastHandler) {
      toastHandler.info(title, message);
    } else {
      alert(`ℹ️ ${title}\n\n${message || ''}`);
    }
  },
};
