import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { ToastItem } from "../store/useGameStore";

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (toastId: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => {
        const icon =
          toast.tone === "success" ? (
            <CheckCircle2 size={18} />
          ) : toast.tone === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <Info size={18} />
          );

        return (
          <button
            key={toast.id}
            className={`toast toast-${toast.tone}`}
            onClick={() => onDismiss(toast.id)}
            type="button"
            aria-label={`${toast.message} 닫기`}
          >
            <span className="toast-body">
              <span className="status-icon">{icon}</span>
              <span>{toast.message}</span>
            </span>
            <X size={16} />
          </button>
        );
      })}
    </div>
  );
}
