import { create } from "zustand";

export type ToastVariant = "default" | "success" | "danger" | "warning";

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  items: ToastItem[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
}

let _id = 0;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (message, variant = "default") => {
    const id = ++_id;
    set((s) => ({ items: [...s.items, { id, message, variant }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3500);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export const toast = {
  show: (msg: string) => useToastStore.getState().push(msg),
  success: (msg: string) => useToastStore.getState().push(msg, "success"),
  error: (msg: string) => useToastStore.getState().push(msg, "danger"),
  warn: (msg: string) => useToastStore.getState().push(msg, "warning"),
};
