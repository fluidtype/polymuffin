import type { ReactNode } from 'react';

export default function KpiCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="bg-brand-panel border border-glass rounded-2xl p-4 shadow-glowSm">
      <div className="flex items-center justify-between">
        <div className="text-white/70 text-sm">{label}</div>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {delta && <div className="mt-1 text-xs text-emerald-300">{delta}</div>}
    </div>
  );
}
