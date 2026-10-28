import React, { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 max-w-xl w-[calc(100%-2rem)] pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss
}) => {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 6000;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      className="pointer-events-auto relative overflow-hidden flex items-center gap-3 sm:gap-4 bg-gray-900 text-white px-5 sm:px-6 py-3 rounded-full shadow-2xl border border-gray-800 transition-all max-w-full"
      role="alert"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            isSuccess ? 'bg-emerald-500' : isError ? 'bg-rose-500' : 'bg-blue-500'
          }`}
        >
          {isSuccess ? (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          ) : isError ? (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <div className="min-w-0">
          <span className="text-sm font-medium text-white truncate block">
            {toast.title}
            {toast.message && <span className="text-gray-400 font-normal ml-2 hidden md:inline text-xs">{toast.message}</span>}
          </span>
        </div>
      </div>

      {toast.actionText && toast.onAction && (
        <>
          <div className="h-4 w-[1px] bg-gray-700 shrink-0" />
          <button
            type="button"
            onClick={() => {
              toast.onAction?.();
              onDismiss(toast.id);
            }}
            className="font-bold text-[#ff787f] hover:text-white bg-white/10 hover:bg-[#d84e55] transition-all uppercase tracking-wider text-[11px] px-2.5 py-0.5 rounded-full shrink-0 cursor-pointer border border-red-400/30 active:scale-95"
          >
            {toast.actionText}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-gray-500 hover:text-white transition-colors p-0.5 ml-1 shrink-0 cursor-pointer"
        aria-label="Close notification"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>

      {/* Subtle bottom progress line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-800">
        <div
          className={`h-full transition-all ease-linear ${
            isSuccess ? 'bg-emerald-400' : isError ? 'bg-rose-400' : 'bg-blue-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
