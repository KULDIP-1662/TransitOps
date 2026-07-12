import { type ReactNode } from 'react';
import clsx from 'clsx';
import { Spinner, EmptyState } from './ui';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export default function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  loading,
  emptyTitle = 'No records',
  emptyHint,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
}) {
  const alignClass = (a?: string) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
            {columns.map((c) => (
              <th
                key={c.key}
                className={clsx(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400',
                  alignClass(c.align)
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-16">
                <div className="flex justify-center">
                  <Spinner className="h-7 w-7" />
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState title={emptyTitle} hint={emptyHint} />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/70 dark:hover:bg-slate-800/40"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={clsx(
                      'px-4 py-3 text-slate-700 dark:text-slate-200',
                      alignClass(c.align),
                      c.className
                    )}
                  >
                    {c.render ? c.render(row) : (row as never)[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
