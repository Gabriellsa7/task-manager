"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastType = "success" | "error";
type Toast = { id: number; type: ToastType; message: string };

const ToastContext = createContext<(type: ToastType, message: string) => void>(
  () => {},
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const show = useCallback((type: ToastType, message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, type, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="fixed right-4 bottom-4 z-10 flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-md px-4 py-2.5 text-white shadow-lg ${
              toast.type === "success" ? "bg-emerald-700" : "bg-red-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
