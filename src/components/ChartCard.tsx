import type { ReactNode } from 'react';
import Card from './ui/Card';
import EmptyState from './EmptyState';

export default function ChartCard({
  title,
  children,
  right,
  isEmpty = false,
  emptyHint,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  isEmpty?: boolean;
  emptyHint?: string;
}) {
  if (isEmpty) {
    return <EmptyState title={title} hint={emptyHint} />;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-white">{title}</h3>
        {right}
      </div>
      {children}
    </Card>
  );
}
