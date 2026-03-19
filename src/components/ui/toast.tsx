"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type ToastTone = "default" | "success" | "warning" | "danger";

type ToastItem = {
  id: string;
  title?: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (opts: {
    message: string;
    title?: string;
    tone?: ToastTone;
    durationMs?: number;
  }) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function toneDot(tone: ToastTone) {
  switch (tone) {
    case "success":
      return "bg-[var(--success)]";
    case "warning":
      return "bg-[var(--warning)]";
    case "danger":
      return "bg-[var(--danger)]";
    default:
      return "bg-[var(--primary)]";
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const timeouts = React.useRef(new Map<string, number>());

  const remove = React.useCallback((id: string) => {
    const t = timeouts.current.get(id);
    if (t) window.clearTimeout(t);
    timeouts.current.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    ({ message, title, tone = "default", durationMs = 2800 }) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      setItems((prev) => [{ id, message, title, tone }, ...prev].slice(0, 4));

      const t = window.setTimeout(() => remove(id), durationMs);
      timeouts.current.set(id, t);
    },
    [remove],
  );

  React.useEffect(() => () => timeouts.current.forEach((t) => clearTimeout(t)), []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className={cn(
          "fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm",
          "flex flex-col gap-2",
        )}
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-[14px] border border-white/10 bg-[#0b0f14] text-white",
              "px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
              "backdrop-blur",
            )}
            role="status"
          >
            <div className="flex items-start gap-3">
              <span
                className={cn("mt-1 h-2.5 w-2.5 rounded-full", toneDot(t.tone))}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                {t.title ? (
                  <div className="text-sm font-medium">{t.title}</div>
                ) : null}
                <div className="text-sm text-white/80">{t.message}</div>
              </div>
              <button
                className="rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => remove(t.id)}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

