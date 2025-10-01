import type { ReactNode } from 'react';

export default function ChartCard({
  title,
  children,
  right,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="bg-brand-panel border border-glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-white/90">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}
