import { toast as toastManager } from "@/components/ui/toast";

export const toast = {
  success: (title: string) => toastManager.add({ title, type: "success" }),
  error: (title: string) => toastManager.add({ title, type: "error" }),
  info: (title: string) => toastManager.add({ title, type: "info" }),
  warning: (title: string) => toastManager.add({ title, type: "warning" }),
};
