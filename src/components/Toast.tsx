"use client";

import { useEffect, useRef } from "react";

export interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  duration?: number;
}

export default function Toast({
  message,
  actionLabel,
  onAction,
  onDismiss,
  duration = 3500,
}: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss?.();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-md bg-text-primary text-paper px-4 py-3 shadow-lg text-sm max-w-sm w-full
        animate-[slideUp_0.2s_ease_forwards] motion-reduce:animate-none"
    >
      <span className="flex-1">{message}</span>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="shrink-0 font-medium text-spice hover:underline focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2"
        >
          {actionLabel}
        </button>
      )}
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-text-muted hover:text-paper focus-visible:outline-2 focus-visible:outline-spice focus-visible:outline-offset-2"
      >
        ✕
      </button>
    </div>
  );
}
