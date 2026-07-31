import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => {
  let timeoutId: any = null;

  return {
    visible: false,
    message: '',
    type: 'info',
    showToast: (message, type = 'info') => {
      if (timeoutId) clearTimeout(timeoutId);
      set({ visible: true, message, type });

      timeoutId = setTimeout(() => {
        set({ visible: false });
      }, 4000); // Hide after 4 seconds
    },
    hideToast: () => {
      if (timeoutId) clearTimeout(timeoutId);
      set({ visible: false });
    },
  };
});
