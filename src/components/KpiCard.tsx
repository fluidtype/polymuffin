import type { ReactNode } from 'react';
import Card from './ui/Card';
import Badge from './ui/Badge';

export default function KpiCard({
  label,
  value,
  delta,
  icon,
  badge,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
  badge?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-text-secondary text-sm">{label}</div>
          {badge && (
            <div className="mt-1">
              <Badge>{badge}</Badge>
            </div>
          )}
        </div>
        {icon}
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      {delta && <div className="mt-2 text-xs text-brand-red/70">{delta}</div>}
    </Card>
  );
}
