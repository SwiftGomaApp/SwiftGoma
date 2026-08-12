import { toast } from "@/components/ui/toast";

export function showSuccessToast(title: string, description?: string) {
  toast.add({ title, description, type: "success" });
}

export function showErrorToast(title: string, description?: string) {
  toast.add({ title, description, type: "error" });
}

export function showInfoToast(title: string, description?: string) {
  toast.add({ title, description, type: "info" });
}
