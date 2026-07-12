import { Card, PageHeader } from '../components/ui';

export default function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle="Coming up in the next build phase" />
      <Card className="p-8">
        <p className="text-slate-500 dark:text-slate-400">
          This module is under construction.
        </p>
      </Card>
    </div>
  );
}
