import { type ReactNode } from 'react';
import { Card } from './ui';

export default function ChartCard({
  title,
  subtitle,
  children,
  height = 280,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3">
        <h3 className="font-heading text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
      <div style={{ width: '100%', height }}>{children}</div>
    </Card>
  );
}
