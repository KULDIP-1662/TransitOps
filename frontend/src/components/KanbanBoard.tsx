import { type ReactNode } from 'react';
import clsx from 'clsx';

export interface KanbanColumn<T> {
  key: string;
  title: string;
  accent?: string; // tailwind border/text color class for the header dot
  items: T[];
}

const DOT: Record<string, string> = {
  slate: 'bg-slate-400',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  red: 'bg-rose-500',
};

export default function KanbanBoard<T extends { id: number | string }>({
  columns,
  renderCard,
}: {
  columns: KanbanColumn<T>[];
  renderCard: (item: T) => ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => (
        <div
          key={col.key}
          className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <span
              className={clsx('h-2 w-2 rounded-full', DOT[col.accent ?? 'slate'])}
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {col.title}
            </span>
            <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {col.items.length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-3">
            {col.items.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">Empty</div>
            ) : (
              col.items.map((item) => <div key={item.id}>{renderCard(item)}</div>)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
