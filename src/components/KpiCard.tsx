import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Icon from './ui/Icon';

type Accent = 'red';

const accentTokens: Record<Accent, { badge: string; icon: string; sparkline: string }> = {
  red: {
    badge: 'bg-gradient-to-br from-brand-red/40 to-brand-red-soft/20 text-brand-red',
    icon: 'text-brand-red',
    sparkline: 'text-brand-red/70',
  },
};

export default function KpiCard({
  label,
  value,
  delta,
  icon,
  badge,
  accent = 'red',
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
  badge?: string;
  accent?: Accent;
}) {
  const theme = accentTokens[accent];
  const sparklineId = useId();

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
        {icon && (
          <span className={`relative grid h-12 w-12 place-items-center overflow-hidden rounded-full ${theme.badge}`}>
            <span className="absolute inset-[1px] rounded-full bg-white/5" aria-hidden />
            <Icon I={icon} className={`relative z-10 h-5 w-5 ${theme.icon}`} />
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      {delta && <div className="mt-2 text-xs text-brand-red/70">{delta}</div>}
      <svg
        className={`mt-4 h-12 w-full ${theme.sparkline}`}
        viewBox="0 0 120 48"
        role="presentation"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${sparklineId}-stroke`} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id={`${sparklineId}-fill`} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M2 36L18 26L34 32L50 14L66 18L82 8L98 18L114 4"
          fill="none"
          stroke={`url(#${sparklineId}-stroke)`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 36L18 26L34 32L50 14L66 18L82 8L98 18L114 4L114 46L2 46Z"
          stroke="none"
          fill={`url(#${sparklineId}-fill)`}
        />
      </svg>
    </Card>
  );
}
