import { type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}) {
  if (!open) return null;
  const width = size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className={`mt-16 w-full ${width} rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
