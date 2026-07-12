import { type ReactNode } from 'react';
import clsx from 'clsx';

const ACCENT: Record<string, string> = {
  indigo: 'border-l-indigo-500',
  green: 'border-l-emerald-500',
  amber: 'border-l-amber-500',
  blue: 'border-l-blue-500',
  red: 'border-l-rose-500',
  slate: 'border-l-slate-400',
};

export default function StatCard({
  label,
  value,
  sub,
  accent = 'indigo',
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: keyof typeof ACCENT;
  icon?: ReactNode;
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        ACCENT[accent]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="tabular mt-1.5 text-2xl font-semibold text-slate-900 dark:text-white">
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
